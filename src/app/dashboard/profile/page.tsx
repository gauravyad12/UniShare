"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  UserCircle,
  Upload,
  Loader2,
  CheckCircle,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
    major: "",
    graduation_year: "",
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/sign-in");
          return;
        }

        setUser(user);

        // Get user profile
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*, university:universities(name)")
          .eq("id", user.id)
          .single();

        setProfile(profile || {});

        // If profile doesn't exist, create one with basic info
        if (!profile) {
          const userData = user.user_metadata || {};
          const newProfile = {
            id: user.id,
            full_name: userData.full_name || "",
            username: userData.username || "",
            email: user.email,
            created_at: new Date().toISOString(),
          };

          // Try to determine university from email domain
          const emailDomain = user.email.split("@")[1];
          if (emailDomain) {
            const { data: universityData } = await supabase
              .from("universities")
              .select("id, name")
              .eq("domain", emailDomain)
              .single();

            if (universityData) {
              newProfile.university_id = universityData.id;
              newProfile.university = { name: universityData.name };
            }
          }

          setProfile(newProfile);

          // Create profile in database
          await supabase.from("user_profiles").insert(newProfile);
        }

        // Set form data
        setFormData({
          full_name: profile?.full_name || user?.user_metadata?.full_name || "",
          username: profile?.username || user?.user_metadata?.username || "",
          bio: profile?.bio || "",
          major: profile?.major || "",
          graduation_year: profile?.graduation_year?.toString() || "",
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "available" | "taken" | "checking" | "unchanged" | "invalid" | null
  >(null);
  const [usernameDebounceTimeout, setUsernameDebounceTimeout] =
    useState<NodeJS.Timeout | null>(null);

  const checkUsername = async (username: string) => {
    if (!username) {
      setUsernameStatus(null);
      return;
    }

    // If username is unchanged from profile, don't check
    if (username === profile?.username) {
      setUsernameStatus("unchanged");
      return;
    }

    // Validate username format
    const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validUsernameRegex.test(username)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    setIsCheckingUsername(true);

    try {
      // First check for bad words
      const badWordsResponse = await fetch("/api/email/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ checkBadWords: true, username }),
      });

      if (!badWordsResponse.ok) {
        const badWordsData = await badWordsResponse.json();
        setUsernameStatus("invalid");
        setIsCheckingUsername(false);
        return;
      }

      // Then check if username is available
      const response = await fetch("/api/username/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      setUsernameStatus(data.available ? "available" : "taken");
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameStatus(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;

    // Special handling for username
    if (id === "username") {
      // Clear any existing timeout
      if (usernameDebounceTimeout) {
        clearTimeout(usernameDebounceTimeout);
      }

      // Set a new timeout to check username after typing stops
      if (value) {
        const timeout = setTimeout(() => {
          checkUsername(value);
        }, 500);
        setUsernameDebounceTimeout(timeout);
      } else {
        setUsernameStatus(null);
      }
    }

    setFormData({
      ...formData,
      [id === "fullName"
        ? "full_name"
        : id === "username"
          ? "username"
          : id === "major"
            ? "major"
            : id === "graduationYear"
              ? "graduation_year"
              : id === "bio"
                ? "bio"
                : id]: value,
    });
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setSaveSuccess(false);
    let hasErrors = false;
    const errors: { [key: string]: string } = {};

    // Clear previous errors
    setFormErrors({});

    // Check if username is taken or invalid
    if (usernameStatus === "taken") {
      errors.username =
        "Username is already taken. Please choose a different one.";
      hasErrors = true;
    }

    if (usernameStatus === "invalid") {
      errors.username =
        "Username contains invalid characters or inappropriate language.";
      hasErrors = true;
    }

    // Show error if username is empty
    if (!formData.username) {
      errors.username = "Username is required.";
      hasErrors = true;
    }

    // Show error if full name is empty
    if (!formData.full_name) {
      errors.fullName = "Full name is required.";
      hasErrors = true;
    }

    // Validate graduation year
    if (formData.graduation_year) {
      const year = parseInt(formData.graduation_year);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear + 10) {
        errors.graduationYear =
          "Graduation year must be between 1900 and 10 years in the future.";
        hasErrors = true;
      }
    }

    // Check for bad words in bio
    if (formData.bio) {
      try {
        const bioCheckResponse = await fetch("/api/email/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ checkBadWords: true, username: formData.bio }),
        });

        if (!bioCheckResponse.ok) {
          errors.bio = "Bio contains inappropriate language.";
          hasErrors = true;
        }
      } catch (error) {
        console.error("Error checking bio for bad words:", error);
        errors.bio = "Error validating bio content.";
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setFormErrors(errors);
      setSaving(false);
      return;
    }

    try {
      // Include avatar_url in the form data if it exists
      const updatedFormData = {
        ...formData,
        avatar_url: profile?.avatar_url,
      };

      console.log("Saving profile data:", updatedFormData);

      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedFormData),
      });

      const data = await response.json();

      if (data.success) {
        setSaveSuccess(true);
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });

        // Update local profile state
        setProfile({
          ...profile,
          full_name: formData.full_name,
          username: formData.username,
          bio: formData.bio,
          major: formData.major,
          graduation_year: formData.graduation_year,
        });

        // Clear success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);

      // Use fetch to upload the image via a FormData object
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      // Update local state with the new avatar URL
      setProfile({
        ...profile,
        avatar_url: data.avatarUrl,
      });

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description:
          "Failed to upload profile picture: " + (error.message || error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and profile settings
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Upload a profile picture to personalize your account
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-20 h-20 text-primary" />
                )}
              </div>
              <div className="relative">
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <Button
                  className="mt-2"
                  onClick={() =>
                    document.getElementById("avatar-upload")?.click()
                  }
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and public profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="fullName">Full Name</Label>
                  </div>
                  <Input
                    id="fullName"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    className={formErrors.fullName ? "border-red-500" : ""}
                  />
                  {formErrors.fullName && (
                    <p className="text-xs text-red-500">
                      {formErrors.fullName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="username">Username</Label>
                    {usernameStatus && usernameStatus !== "unchanged" && (
                      <div className="flex items-center text-xs">
                        {usernameStatus === "checking" ? (
                          <div className="flex items-center text-muted-foreground">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Checking...
                          </div>
                        ) : usernameStatus === "available" ? (
                          <div className="flex items-center text-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Available
                          </div>
                        ) : (
                          <div className="flex items-center text-red-500">
                            <XCircle className="h-3 w-3 mr-1" />
                            {usernameStatus === "invalid" ? "Invalid" : "Taken"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Choose a username"
                    className={
                      usernameStatus === "taken" ||
                      usernameStatus === "invalid" ||
                      formErrors.username
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {formErrors.username ? (
                    <p className="text-xs text-red-500">
                      {formErrors.username}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      This will be used for your profile URL: /u/
                      {formData.username}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email}
                  disabled
                  className="bg-muted/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <Input
                    id="university"
                    value={
                      profile?.university?.name ||
                      profile?.university_name ||
                      "Not set"
                    }
                    disabled
                    className="bg-muted/50"
                    title="This is set automatically based on your email domain"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically set based on your email domain
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="graduationYear">Graduation Year</Label>
                  <Input
                    id="graduationYear"
                    type="number"
                    value={formData.graduation_year}
                    onChange={handleInputChange}
                    placeholder="Expected graduation year"
                    className={
                      formErrors.graduationYear ? "border-red-500" : ""
                    }
                  />
                  {formErrors.graduationYear && (
                    <p className="text-xs text-red-500">
                      {formErrors.graduationYear}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="major">Major/Field of Study</Label>
                <Input
                  id="major"
                  value={formData.major}
                  onChange={handleInputChange}
                  placeholder="Your major or field of study"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell others about yourself"
                  rows={4}
                  className={formErrors.bio ? "border-red-500" : ""}
                />
                {formErrors.bio && (
                  <p className="text-xs text-red-500">{formErrors.bio}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              {Object.keys(formErrors).length > 0 && (
                <div className="text-red-500 text-sm">
                  Please fix the errors above before saving.
                </div>
              )}
              {saveSuccess && (
                <div className="flex items-center text-green-500">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Profile saved successfully</span>
                </div>
              )}
              <div className="ml-auto">
                <Button onClick={handleSaveChanges} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

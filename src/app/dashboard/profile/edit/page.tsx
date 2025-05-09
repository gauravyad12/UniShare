"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
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
import CanvasIntegrationCard from "@/components/canvas-integration-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  UserCircle,
  Upload,
  Loader2,
  CheckCircle,
  Trash2,
  XCircle,
  Plus,
  X,
  AlertCircle,
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
import { validateImageFile, ALLOWED_IMAGE_TYPES, formatFileSize, MAX_AVATAR_SIZE } from "@/utils/imageValidation";
import { toast } from "@/components/ui/use-toast";

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Track loading and success states separately
  const [savingStates, setSavingStates] = useState({
    profile: false
  });
  const [successStates, setSuccessStates] = useState({
    profile: false
  });

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
    major: "",
    graduation_year: "",
  });

  // State for managing courses
  const [courses, setCourses] = useState<string[]>([]);
  const [newCourse, setNewCourse] = useState("");
  const courseInputRef = useRef<HTMLInputElement>(null);
  const [courseError, setCourseError] = useState("");

  // Character limits for each field
  const charLimits = {
    fullName: 30,
    username: 30,
    bio: 500,
    major: 30
  };

  // Character counts
  const [charCounts, setCharCounts] = useState({
    fullName: 0,
    username: 0,
    bio: 0,
    major: 0
  });
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
        const newFormData = {
          full_name: profile?.full_name || user?.user_metadata?.full_name || "",
          username: profile?.username || user?.user_metadata?.username || "",
          bio: profile?.bio || "",
          major: profile?.major || "",
          graduation_year: profile?.graduation_year?.toString() || "",
        };

        setFormData(newFormData);

        // Initialize character counts
        setCharCounts({
          fullName: newFormData.full_name.length,
          username: newFormData.username.length,
          bio: newFormData.bio.length,
          major: newFormData.major.length
        });

        // Fetch user courses
        const { data: userCourses } = await supabase
          .from("user_courses")
          .select("course_code")
          .eq("user_id", user.id);

        if (userCourses && userCourses.length > 0) {
          setCourses(userCourses.map(course => course.course_code));
        }
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
      // First check for bad words using our utility
      const { containsBadWords } = await import('@/utils/badWords');

      if (await containsBadWords(username)) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

      // Update character count
      setCharCounts(prev => ({
        ...prev,
        username: value.length
      }));
    }

    // Special handling for graduation year
    if (id === "graduationYear") {
      // Only allow numeric input
      const numericValue = value.replace(/[^0-9]/g, '');

      setFormData({
        ...formData,
        graduation_year: numericValue,
      });
      return;
    }

    // Special handling for course input
    if (id === "courseInput") {
      setNewCourse(value.toUpperCase());
      setCourseError("");
      return;
    }

    // Update character counts based on field
    if (id === "fullName") {
      setCharCounts(prev => ({
        ...prev,
        fullName: value.length
      }));
    } else if (id === "bio") {
      setCharCounts(prev => ({
        ...prev,
        bio: value.length
      }));
    } else if (id === "major") {
      setCharCounts(prev => ({
        ...prev,
        major: value.length
      }));
    }

    setFormData({
      ...formData,
      [id === "fullName"
        ? "full_name"
        : id === "username"
          ? "username"
          : id === "major"
            ? "major"
            : id === "bio"
              ? "bio"
              : id]: value,
    });
  };

  // Function to add a new course
  const handleAddCourse = () => {
    // Validate course code
    if (!newCourse) {
      setCourseError("Please enter a course code");
      return;
    }

    // Check if course code is already in the list
    if (courses.includes(newCourse)) {
      setCourseError("This course is already in your list");
      return;
    }

    // Validate course code format (e.g., CS101, MATH200, etc.)
    const courseCodeRegex = /^[A-Z]{2,4}\d{3,4}$/;
    if (!courseCodeRegex.test(newCourse)) {
      setCourseError("Please enter a valid course code (e.g., CS101, MATH200)");
      return;
    }

    // Add course to the list
    setCourses([...courses, newCourse]);
    setNewCourse("");
    setCourseError("");

    // Focus back on the input field
    if (courseInputRef.current) {
      courseInputRef.current.focus();
    }
  };

  // Function to remove a course
  const handleRemoveCourse = (courseToRemove: string) => {
    setCourses(courses.filter(course => course !== courseToRemove));
  };

  // Handle key press in course input (add course on Enter)
  const handleCourseKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCourse();
    }
  };

  const handleSaveChanges = async () => {
    // Set the profile card to loading state
    setSavingStates(prev => ({
      ...prev,
      profile: true
    }));

    // Reset success state
    setSuccessStates(prev => ({
      ...prev,
      profile: false
    }));

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

    // Import the bad words utility
    const { containsBadWords } = await import('@/utils/badWords');

    // Check for bad words in full name
    if (formData.full_name && await containsBadWords(formData.full_name)) {
      errors.fullName = "Full name contains inappropriate language.";
      hasErrors = true;
    }

    // Check for bad words in bio
    if (formData.bio && await containsBadWords(formData.bio)) {
      errors.bio = "Bio contains inappropriate language.";
      hasErrors = true;
    }

    // Check for bad words in major
    if (formData.major && await containsBadWords(formData.major)) {
      errors.major = "Major contains inappropriate language.";
      hasErrors = true;
    }

    if (hasErrors) {
      setFormErrors(errors);
      setSavingStates(prev => ({
        ...prev,
        profile: false
      }));
      return;
    }

    try {
      // Include avatar_url in the form data if it exists
      // Also ensure username is lowercase
      const updatedFormData = {
        ...formData,
        username: formData.username.toLowerCase(), // Convert username to lowercase
        avatar_url: profile?.avatar_url || null,
        courses: courses, // Add courses to the form data
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
        // Set success state for the profile card
        setSuccessStates(prev => ({
          ...prev,
          profile: true
        }));

        // Update local profile state
        setProfile({
          ...profile,
          full_name: formData.full_name,
          username: formData.username.toLowerCase(), // Use lowercase username
          bio: formData.bio,
          major: formData.major,
          graduation_year: formData.graduation_year,
        });

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessStates(prev => ({
            ...prev,
            profile: false
          }));
        }, 3000);
      } else {
        console.error("Error updating profile:", data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      // Reset loading state for the profile card
      setSavingStates(prev => ({
        ...prev,
        profile: false
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if the file is an allowed image type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only image files are accepted",
        variant: "destructive",
      });
      e.target.value = ''; // Clear the file input
      return;
    }

    // Check file size
    if (file.size > MAX_AVATAR_SIZE) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${formatFileSize(MAX_AVATAR_SIZE)}`,
        variant: "destructive",
      });
      e.target.value = ''; // Clear the file input
      return;
    }

    try {
      setSavingStates(prev => ({
        ...prev,
        profile: true
      }));

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
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error uploading image:", errorMessage);
      toast({
        title: "Error uploading image",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSavingStates(prev => ({
        ...prev,
        profile: false
      }));
      e.target.value = ''; // Clear the file input after upload (success or failure)
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="profile-card-container">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription className="mt-2">
                  Upload a profile picture to personalize your account
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center card-content">
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
                <div className="relative flex flex-col items-center">
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept={ALLOWED_IMAGE_TYPES.join(',')}
                    onChange={handleImageUpload}
                  />
                  <Button
                    className="mt-2"
                    onClick={() =>
                      document.getElementById("avatar-upload")?.click()
                    }
                    disabled={savingStates.profile}
                  >
                    {savingStates.profile ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {savingStates.profile ? "Uploading..." : "Upload Image"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Accepted formats: JPEG, PNG, GIF, WebP, SVG<br />
                    Max size: {formatFileSize(MAX_AVATAR_SIZE)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <CanvasIntegrationCard />
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription className="mt-2">
                Update your personal details and public profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="fullName">Full Name</Label>
                    <p className="text-xs text-muted-foreground">{charCounts.fullName}/{charLimits.fullName}</p>
                  </div>
                  <Input
                    id="fullName"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    maxLength={charLimits.fullName}
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
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">{charCounts.username}/{charLimits.username}</p>
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
                  </div>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Choose a username"
                    maxLength={charLimits.username}
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
                    onChange={(e) => {
                      // Only allow numeric input
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({
                        ...formData,
                        graduation_year: value
                      });
                    }}
                    onKeyDown={(e) => {
                      // Prevent non-numeric keys except for backspace, delete, tab, etc.
                      if (!/[0-9]/.test(e.key) &&
                          !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    min="1900"
                    max={new Date().getFullYear() + 10}
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="major">Major/Field of Study</Label>
                  <p className="text-xs text-muted-foreground">{charCounts.major}/{charLimits.major}</p>
                </div>
                <Input
                  id="major"
                  value={formData.major}
                  onChange={handleInputChange}
                  placeholder="Your major or field of study"
                  maxLength={charLimits.major}
                  className={formErrors.major ? "border-red-500" : ""}
                />
                {formErrors.major && (
                  <p className="text-xs text-red-500">{formErrors.major}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="bio">Bio</Label>
                  <p className="text-xs text-muted-foreground">{charCounts.bio}/{charLimits.bio}</p>
                </div>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell others about yourself"
                  rows={4}
                  maxLength={charLimits.bio}
                  className={formErrors.bio ? "border-red-500" : ""}
                />
                {formErrors.bio && (
                  <p className="text-xs text-red-500">{formErrors.bio}</p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="courseInput">My Courses</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Add your courses to receive notifications about new resources matching your courses when resource notifications are enabled.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="courseInput"
                    ref={courseInputRef}
                    value={newCourse}
                    onChange={handleInputChange}
                    onKeyDown={handleCourseKeyPress}
                    placeholder="Enter course code (e.g., CS101)"
                    className={courseError ? "border-red-500" : ""}
                    maxLength={10}
                  />
                  <Button type="button" onClick={handleAddCourse}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                {courseError && (
                  <p className="text-xs text-red-500">{courseError}</p>
                )}

                <div className="border rounded-md p-3 bg-muted/30 mt-2">
                  {courses.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {courses.map((course) => (
                        <Badge key={course} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                          {course}
                          <button
                            type="button"
                            onClick={() => handleRemoveCourse(course)}
                            className="ml-1 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">No courses added yet</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              {Object.keys(formErrors).length > 0 && (
                <div className="text-red-500 text-sm">
                  Please fix the errors above before saving.
                </div>
              )}
              {successStates.profile && (
                <div className="flex items-center text-green-500">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Profile saved successfully</span>
                  <span className="md:hidden">Success</span>
                </div>
              )}
              <div className="ml-auto">
                <Button onClick={handleSaveChanges} disabled={savingStates.profile}>
                  {savingStates.profile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="md:inline">Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden md:inline">Save Changes</span>
                      <span className="md:hidden">Save</span>
                    </>
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

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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bell,
  Moon,
  Shield,
  Trash2,
  Check,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import { useThemeContext } from "@/components/theme-context";
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

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    fontSize,
    setFontSize,
  } = useThemeContext();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settings, setSettings] = useState({
    email_notifications: true,
    study_group_notifications: true,
    resource_notifications: true,
    profile_visibility: true,
    theme_preference: "system",
    color_scheme: "default",
    font_size: 2, // 1-5 scale
  });

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

        // Get user settings
        const { data: userSettings } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (userSettings) {
          setSettings({
            email_notifications: userSettings.email_notifications ?? true,
            study_group_notifications:
              userSettings.study_group_notifications ?? true,
            resource_notifications: userSettings.resource_notifications ?? true,
            profile_visibility: userSettings.profile_visibility ?? true,
            theme_preference: userSettings.theme_preference || "system",
            color_scheme: userSettings.color_scheme || "default",
            font_size: userSettings.font_size || 2,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Sync settings with theme context when loaded
  useEffect(() => {
    if (!loading) {
      setSettings((prev) => ({
        ...prev,
        theme_preference: theme || "system",
        color_scheme: accentColor || "default",
        font_size: fontSize || 2,
      }));
    }
  }, [loading, theme, accentColor, fontSize]);

  const handleSwitchChange = (id) => {
    setSettings({
      ...settings,
      [id]: !settings[id],
    });
  };

  const handleThemeChange = (newTheme) => {
    setSettings({
      ...settings,
      theme_preference: newTheme,
    });
    setTheme(newTheme);
  };

  const handleColorChange = (color) => {
    setSettings({
      ...settings,
      color_scheme: color,
    });
    setAccentColor(color);
  };

  const handleFontSizeChange = (size) => {
    setSettings({
      ...settings,
      font_size: size,
    });
    setFontSize(size);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/settings/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        setSaveSuccess(true);
        toast({
          title: "Settings updated",
          description: "Your settings have been successfully updated.",
        });

        // Clear success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  function getColorValue(color: string): string {
    const colorMap = {
      default: "rgb(59, 130, 246)", // Original primary color
      blue: "rgb(59, 130, 246)",
      yellow: "rgb(234, 179, 8)",
      pink: "rgb(236, 72, 153)",
      purple: "rgb(168, 85, 247)",
      orange: "rgb(249, 115, 22)",
      green: "rgb(34, 197, 94)",
    };

    return colorMap[color as keyof typeof colorMap] || colorMap.default;
  }

  const handleDeleteAccount = async () => {
    try {
      const supabase = createClient();

      // Sign out and redirect instead of trying to delete the account directly
      // Admin functions are not available in the client
      await supabase.auth.signOut();
      router.push("/");

      toast({
        title: "Signed out",
        description: "Please contact support to delete your account.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Control how you receive notifications and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications about activity
                  </p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={() =>
                    handleSwitchChange("email_notifications")
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Study Group Updates</h4>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new messages and meetings
                  </p>
                </div>
                <Switch
                  id="study_group_notifications"
                  checked={settings.study_group_notifications}
                  onCheckedChange={() =>
                    handleSwitchChange("study_group_notifications")
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Resource Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new resources in your courses
                  </p>
                </div>
                <Switch
                  id="resource_notifications"
                  checked={settings.resource_notifications}
                  onCheckedChange={() =>
                    handleSwitchChange("resource_notifications")
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how the application looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Display</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div
                    className={`border rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary ${settings.theme_preference === "light" ? "border-primary bg-primary/5" : ""}`}
                    onClick={() => handleThemeChange("light")}
                  >
                    <div className="w-full h-20 bg-white border rounded-md flex items-center justify-center">
                      <span className="text-black">Aa</span>
                    </div>
                    <span className="text-sm font-medium">Light</span>
                  </div>
                  <div
                    className={`border rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary ${settings.theme_preference === "system" ? "border-primary bg-primary/5" : ""}`}
                    onClick={() => handleThemeChange("system")}
                  >
                    <div className="w-full h-20 bg-muted border rounded-md flex items-center justify-center">
                      <span className="text-foreground">Aa</span>
                    </div>
                    <span className="text-sm font-medium">System</span>
                  </div>
                  <div
                    className={`border rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary ${settings.theme_preference === "dark" ? "border-primary bg-primary/5" : ""}`}
                    onClick={() => handleThemeChange("dark")}
                  >
                    <div className="w-full h-20 bg-black border rounded-md flex items-center justify-center">
                      <span className="text-white">Aa</span>
                    </div>
                    <span className="text-sm font-medium">Dark</span>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Font size</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Aa</span>
                    <div className="flex-1 mx-4">
                      <div className="relative h-1 bg-border rounded-full">
                        <div
                          className="absolute inset-y-0 left-0 bg-primary rounded-full"
                          style={{
                            width: `${(settings.font_size / 5) * 100}%`,
                          }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-between px-0.5">
                          {[1, 2, 3, 4, 5].map((size) => (
                            <div
                              key={size}
                              className={`w-3 h-3 rounded-full cursor-pointer ${settings.font_size >= size ? "bg-primary" : "bg-primary/30"}`}
                              onClick={() => handleFontSizeChange(size)}
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-base font-bold">Aa</span>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Color</h4>
                  <div className="flex items-center gap-4">
                    <div
                      key="default"
                      className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer overflow-hidden border border-gray-300`}
                      onClick={() => handleColorChange("default")}
                      style={{
                        background:
                          "linear-gradient(to right, white 50%, black 50%)",
                      }}
                    >
                      {settings.color_scheme === "default" && (
                        <Check className="h-5 w-5 text-white drop-shadow-[0_0_1px_rgba(0,0,0,1)]" />
                      )}
                    </div>
                    {[
                      { name: "blue", color: "bg-blue-500" },
                      { name: "yellow", color: "bg-yellow-400" },
                      { name: "pink", color: "bg-pink-500" },
                      { name: "purple", color: "bg-purple-500" },
                      { name: "orange", color: "bg-orange-500" },
                      { name: "green", color: "bg-green-500" },
                    ].map((colorOption) => (
                      <div
                        key={colorOption.name}
                        className={`w-10 h-10 ${colorOption.color} rounded-full flex items-center justify-center cursor-pointer`}
                        onClick={() => handleColorChange(colorOption.name)}
                      >
                        {settings.color_scheme === colorOption.name && (
                          <Check className="h-5 w-5 text-white" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            {saveSuccess && (
              <div className="flex items-center text-green-500">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>Settings saved successfully</span>
              </div>
            )}
            <div className="ml-auto">
              <Button onClick={handleSaveSettings} disabled={saving}>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>
              Manage your privacy settings and account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Profile Visibility</h4>
                  <p className="text-sm text-muted-foreground">
                    Control who can see your profile information
                  </p>
                </div>
                <Switch
                  id="profile_visibility"
                  checked={settings.profile_visibility}
                  onCheckedChange={() =>
                    handleSwitchChange("profile_visibility")
                  }
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Password</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Change your password to keep your account secure
              </p>
              <Button variant="outline" asChild>
                <a href="/dashboard/reset-password">Change Password</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Permanent actions that cannot be undone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h4 className="font-medium">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

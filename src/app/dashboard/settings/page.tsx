"use client";

export const dynamic = "force-dynamic";

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
import {
  Bell,
  Moon,
  Shield,
  Trash2,
  Check,
  Loader2,
  CheckCircle,
  LogOut,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
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
import { broadcastThemeChange, saveThemeToStorage } from "@/lib/theme-utils";

export default function SettingsPage() {
  const router = useRouter();
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
  // Track loading and success states for each card separately
  const [savingStates, setSavingStates] = useState({
    notifications: false,
    appearance: false,
    privacy: false
  });
  const [successStates, setSuccessStates] = useState({
    notifications: false,
    appearance: false,
    privacy: false
  });
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
          const emailNotificationsEnabled = userSettings.email_notifications ?? true;

          setSettings({
            email_notifications: emailNotificationsEnabled,
            study_group_notifications:
              userSettings.study_group_notifications ?? true,
            resource_notifications: userSettings.resource_notifications ?? true,
            profile_visibility: userSettings.profile_visibility ?? true,
            theme_preference: userSettings.theme_preference || "system",
            color_scheme: userSettings.color_scheme || "default",
            font_size: userSettings.font_size || 2,
          });

          // Update Resend audience subscription status based on email notifications setting
          if (user.email) {
            try {
              // Get user profile for full name
              const { data: profileData } = await supabase
                .from('user_profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

              // Prepare the request data
              const requestData = {
                email: user.email,
                fullName: profileData?.full_name || '',
                userId: user.id,
                fromServer: false,
                unsubscribe: !emailNotificationsEnabled // Set unsubscribe based on email notifications setting
              };

              // Add/update user in Resend audience with appropriate subscription status
              const resendResponse = await fetch('/api/resend/audience', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
              });

              const resendData = await resendResponse.json();

              if (!resendData.success && resendData.error) {
                console.error('Error updating Resend audience subscription:', resendData.error);
              }
            } catch (resendError) {
              console.error('Error updating Resend audience subscription:', resendError);
              // Continue despite Resend error
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Sync settings with theme context when loaded or when theme changes
  useEffect(() => {
    if (!loading) {
      // Only update settings from context if they're different
      // This prevents overriding database values with default values
      setSettings((prev) => ({
        ...prev,
        theme_preference:
          prev.theme_preference !== "system"
            ? prev.theme_preference
            : theme || "system",
        color_scheme:
          prev.color_scheme !== "default"
            ? prev.color_scheme
            : accentColor || "default",
        font_size: prev.font_size !== 2 ? prev.font_size : fontSize || 2,
      }));
    }
  }, [loading, theme, accentColor, fontSize]);

  // Listen for theme changes from localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme" && e.newValue) {
        setSettings((prev) => ({
          ...prev,
          theme_preference: e.newValue || "system",
        }));
        setTheme(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check localStorage on mount to ensure we're in sync
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme && storedTheme !== theme) {
      setSettings((prev) => ({
        ...prev,
        theme_preference: storedTheme || "system",
      }));
      setTheme(storedTheme);
    }

    return () => window.removeEventListener("storage", handleStorageChange);
  }, [setTheme, theme]);

  const handleSwitchChange = (id: string) => {
    const newValue = !settings[id as keyof typeof settings];

    setSettings({
      ...settings,
      [id]: newValue,
    });

    // No immediate API calls - will be handled when Save Settings is clicked
  };

  const handleThemeChange = (newTheme: string) => {
    // Update local state
    setSettings({
      ...settings,
      theme_preference: newTheme,
    });

    // Update theme context
    setTheme(newTheme);

    // Directly apply theme to document for immediate effect
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else if (newTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else if (newTheme === "system") {
      const isDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      }
    }

    // Save to localStorage to ensure persistence
    saveThemeToStorage(newTheme);

    // Broadcast theme change to other tabs/windows
    broadcastThemeChange(newTheme);

    // Auto-save after a short delay
    setTimeout(() => {
      const saveButton = document.getElementById('appearance-save-button');
      if (saveButton) {
        (saveButton as HTMLButtonElement).click();
      }
    }, 1000);
  };

  const handleColorChange = (color: string) => {
    // Update local state
    setSettings({
      ...settings,
      color_scheme: color,
    });

    // Update theme context - this will apply the changes immediately
    setAccentColor(color);

    // Additional direct DOM manipulation for immediate effect
    const dashboardContainer = document.querySelector(".dashboard-styles");
    if (dashboardContainer) {
      if (color === "default") {
        dashboardContainer.removeAttribute("data-accent");
      } else {
        dashboardContainer.setAttribute("data-accent", color);
      }
    }

    // Save to localStorage for persistence across page refreshes
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem("accent-color", color);
    }

    // Auto-save after a short delay
    setTimeout(() => {
      const saveButton = document.getElementById('appearance-save-button');
      if (saveButton) {
        (saveButton as HTMLButtonElement).click();
      }
    }, 1000);
  };

  const handleFontSizeChange = (size: number) => {
    // Update local state
    setSettings({
      ...settings,
      font_size: size,
    });

    // Update theme context - this will apply the changes immediately
    setFontSize(size);

    // Additional direct DOM manipulation for immediate effect
    const rootSize = 16 + (size - 2) * 1; // Base size is 16px, each step changes by 1px
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${rootSize}px`;

      // Also apply to dashboard container if it exists
      const dashboardContainer = document.querySelector(".dashboard-styles");
      if (dashboardContainer) {
        // Use setAttribute for TypeScript compatibility
        dashboardContainer.setAttribute('style', `font-size: ${rootSize}px`);
      }
    }

    // Save to localStorage for persistence across page refreshes
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem("font-size", size.toString());
    }

    // Auto-save after a short delay
    setTimeout(() => {
      const saveButton = document.getElementById('appearance-save-button');
      if (saveButton) {
        (saveButton as HTMLButtonElement).click();
      }
    }, 1000);
  };

  const handleSaveSettings = async (cardType: 'notifications' | 'appearance' | 'privacy') => {
    // Set the specific card to loading state
    setSavingStates(prev => ({
      ...prev,
      [cardType]: true
    }));

    // Reset success state for this card
    setSuccessStates(prev => ({
      ...prev,
      [cardType]: false
    }));

    try {
      // Apply theme, accent color, and font size changes to the context
      setTheme(settings.theme_preference);
      setAccentColor(settings.color_scheme);
      setFontSize(settings.font_size);

      // Get the current settings from the database to ensure we have all values
      const supabase = createClient();
      const { data: currentSettings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Prepare the settings to update based on the card type
      let settingsToUpdate = { ...settings };

      // If we have current settings from the database, use them as a base
      if (currentSettings) {
        // Start with current settings from database
        settingsToUpdate = {
          email_notifications: currentSettings.email_notifications,
          study_group_notifications: currentSettings.study_group_notifications,
          resource_notifications: currentSettings.resource_notifications,
          profile_visibility: currentSettings.profile_visibility,
          theme_preference: currentSettings.theme_preference,
          color_scheme: currentSettings.color_scheme,
          font_size: currentSettings.font_size,
        };

        // Update only the relevant settings based on card type
        if (cardType === 'notifications') {
          settingsToUpdate.email_notifications = settings.email_notifications;
          settingsToUpdate.study_group_notifications = settings.study_group_notifications;
          settingsToUpdate.resource_notifications = settings.resource_notifications;
        } else if (cardType === 'appearance') {
          settingsToUpdate.theme_preference = settings.theme_preference;
          settingsToUpdate.color_scheme = settings.color_scheme;
          settingsToUpdate.font_size = settings.font_size;
        } else if (cardType === 'privacy') {
          settingsToUpdate.profile_visibility = settings.profile_visibility;
        }
      }

      // Log the settings being saved
      console.log(`Saving ${cardType} settings to database:`, settingsToUpdate);

      // If saving notifications settings, handle Resend audience update
      if (cardType === 'notifications' && user?.email) {
        try {
          console.log('Updating Resend audience subscription status based on email_notifications setting');

          // Get user profile for full name
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', user?.id)
            .single();

          // Update Resend audience subscription status
          const resendResponse = await fetch('/api/resend/audience', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              fullName: profileData?.full_name || '',
              userId: user.id,
              fromServer: false,
              unsubscribe: !settings.email_notifications // Unsubscribe if email_notifications is false
            }),
          });

          const resendData = await resendResponse.json();
          console.log(`Resend audience update (${settings.email_notifications ? 'subscribe' : 'unsubscribe'}):`, resendData);
        } catch (resendError) {
          console.error('Error updating Resend audience:', resendError);
          // Continue despite Resend error - we'll still save the settings to the database
        }
      }

      // Save to database
      const response = await fetch("/api/settings/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsToUpdate),
      });

      const data = await response.json();

      if (data.success) {
        // Set success state for this specific card
        setSuccessStates(prev => ({
          ...prev,
          [cardType]: true
        }));

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessStates(prev => ({
            ...prev,
            [cardType]: false
          }));
        }, 3000);
      } else {
        console.error("Error updating settings:", data.error || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      // Reset loading state for this specific card
      setSavingStates(prev => ({
        ...prev,
        [cardType]: false
      }));
    }
  };

  const [deletingAccount, setDeletingAccount] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      // Redirect to the app entry page
      router.push("/app-entry");
    } catch (error) {
      console.error("Error logging out:", error);
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      // Call the delete API endpoint
      const response = await fetch("/api/profile/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("Account deleted successfully:", data.message || "Your account has been successfully deleted.");
        router.push("/");
      } else {
        throw new Error(data.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error instanceof Error ? error.message : "Failed to delete your account. Please try again later.");
      setDeletingAccount(false);
      setShowDeleteDialog(false);
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
                <div className="pr-4">
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground mt-1">
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
                <div className="pr-4">
                  <h4 className="font-medium">Study Group Updates</h4>
                  <p className="text-sm text-muted-foreground mt-1">
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
                <div className="pr-4">
                  <h4 className="font-medium">Resource Notifications</h4>
                  <p className="text-sm text-muted-foreground mt-1">
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
          <CardFooter className="flex justify-between items-center">
            {successStates.notifications && (
              <div className="flex items-center text-green-500">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Settings saved successfully</span>
                <span className="md:hidden">Success</span>
              </div>
            )}
            <div className="ml-auto">
              <Button onClick={() => handleSaveSettings('notifications')} disabled={savingStates.notifications}>
                {savingStates.notifications ? (
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
                      className={`w-10 aspect-square rounded-full flex items-center justify-center cursor-pointer overflow-hidden border border-gray-300 ${settings.color_scheme === "default" ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      onClick={() => handleColorChange("default")}
                    >
                      <div className="flex h-full w-full">
                        <div className="h-full w-1/2 bg-white"></div>
                        <div className="h-full w-1/2 bg-black"></div>
                      </div>
                      {settings.color_scheme === "default" && (
                        <Check className="absolute h-5 w-5 text-white drop-shadow-[0_0_1px_rgba(0,0,0,1)]" />
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
                        className={`w-10 aspect-square ${colorOption.color} rounded-full flex items-center justify-center cursor-pointer ${settings.color_scheme === colorOption.name ? "ring-2 ring-primary ring-offset-2" : ""}`}
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
            {successStates.appearance ? (
              <div className="flex items-center text-green-500">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Settings saved successfully</span>
                <span className="md:hidden">Success</span>
              </div>
            ) : (
              savingStates.appearance ? (
                <div className="flex items-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Saving changes...</span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <span>Changes are saved automatically</span>
                </div>
              )
            )}
            <div className="hidden">
              <Button id="appearance-save-button" onClick={() => handleSaveSettings('appearance')} disabled={savingStates.appearance}>
                Save Changes
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
                <div className="pr-4">
                  <h4 className="font-medium">Profile Visibility</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Control who can see your profile information
                  </p>
                </div>
                <Switch
                  id="profile_visibility"
                  checked={settings.profile_visibility}
                  onCheckedChange={(checked) => {
                    // Just update the settings state without auto-saving
                    setSettings(prev => ({
                      ...prev,
                      profile_visibility: checked
                    }));
                  }}
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
          <CardFooter className="flex justify-between items-center">
            {successStates.privacy && (
              <div className="flex items-center text-green-500">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Settings saved successfully</span>
                <span className="md:hidden">Success</span>
              </div>
            )}
            <div className="ml-auto">
              <Button onClick={() => handleSaveSettings('privacy')} disabled={savingStates.privacy}>
                {savingStates.privacy ? (
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

        {/* Mobile-only logout card */}
        <Card className="md:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>
              Sign out of your account
            </CardDescription>
          </CardHeader>
          {/* CardContent removed to decrease space */}
          <CardFooter>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950/30"
            >
              {loggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
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
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </CardFooter>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="sm:max-w-[425px] p-6">
              <DialogHeader className="space-y-2 text-center sm:text-left">
                <DialogTitle className="text-lg font-semibold">Delete Account</DialogTitle>
              </DialogHeader>
              <div className="py-4 mb-4">
                <p className="text-sm text-muted-foreground text-center sm:text-left">
                  This action cannot be undone. This will permanently delete your account
                  and all of your data, including resources, study groups, and profile information.
                </p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-1 space-y-reverse sm:space-y-0">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deletingAccount}
                  className="sm:mt-0 mt-1 h-8 sm:h-9 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                  tabIndex={-1}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="hover:bg-red-600 dark:hover:bg-red-700 h-8 sm:h-9 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                >
                  {deletingAccount ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Account"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </div>
  );
}

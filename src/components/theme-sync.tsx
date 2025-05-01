"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { ThemeStorage } from "@/lib/theme-storage";
import { createClient } from "@/utils/supabase/client";

export function ThemeSync() {
  const { theme, setTheme } = useTheme();

  // Load theme from storage on initial render
  useEffect(() => {
    const savedTheme = ThemeStorage.getTheme();
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [setTheme]);

  // Save theme to local storage when it changes, but don't update database
  useEffect(() => {
    if (theme) {
      // Only save to local storage, not to database
      ThemeStorage.saveTheme(theme);

      // Database updates are now handled by the Save button in settings
      // const updateThemeInDatabase = async () => {
      //   try {
      //     const supabase = createClient();
      //     const { data } = await supabase.auth.getUser();
      //
      //     if (data?.user) {
      //       // User is logged in, update theme in database
      //       await fetch("/api/settings/update-theme", {
      //         method: "POST",
      //         headers: {
      //           "Content-Type": "application/json",
      //         },
      //         body: JSON.stringify({ theme }),
      //       });
      //     }
      //   } catch (error) {
      //     console.error("Error updating theme in database:", error);
      //   }
      // };
      //
      // updateThemeInDatabase();
    }
  }, [theme]);

  return null;
}

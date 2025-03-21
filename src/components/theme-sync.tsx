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

  // Save theme to storage when it changes
  useEffect(() => {
    if (theme) {
      ThemeStorage.saveTheme(theme);

      // Update theme in database if user is logged in
      const updateThemeInDatabase = async () => {
        try {
          const supabase = createClient();
          const { data } = await supabase.auth.getUser();

          if (data?.user) {
            // User is logged in, update theme in database
            await fetch("/api/settings/update-theme", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ theme }),
            });
          }
        } catch (error) {
          console.error("Error updating theme in database:", error);
        }
      };

      updateThemeInDatabase();
    }
  }, [theme]);

  return null;
}

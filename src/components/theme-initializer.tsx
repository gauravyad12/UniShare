"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { ThemeStorage } from "@/lib/theme-storage";

export function ThemeInitializer() {
  const { setTheme } = useTheme();

  useEffect(() => {
    // Get theme from storage and apply it immediately
    const storedTheme = ThemeStorage.getTheme();
    if (storedTheme) {
      setTheme(storedTheme);
    }

    // For users who are logged in, fetch theme from database
    const fetchThemeFromDatabase = async () => {
      try {
        const response = await fetch("/api/settings/get-theme", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.theme) {
            setTheme(data.theme);
            ThemeStorage.saveTheme(data.theme);
          }
        }
      } catch (error) {
        console.error("Error fetching theme from database:", error);
      }
    };

    fetchThemeFromDatabase();
  }, [setTheme]);

  return null;
}

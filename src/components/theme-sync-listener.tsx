"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { ThemeStorage } from "@/lib/theme-storage";

// This component listens for theme changes and syncs them
export function ThemeSyncListener() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!theme) return;

    // When theme changes, save it to storage
    ThemeStorage.saveTheme(theme);

    // Listen for storage events from other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === "app-theme" &&
        event.newValue &&
        event.newValue !== theme
      ) {
        setTheme(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [theme, setTheme]);

  return null;
}

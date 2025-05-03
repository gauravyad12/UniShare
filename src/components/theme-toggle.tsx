"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useThemeContext } from "./theme-context";
import { createClient } from "@/utils/supabase/client";

export function ThemeToggle() {
  const { resolvedTheme, setTheme: setNextTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  // Try to use theme context, but fall back to next-themes if not available
  let themeContext;
  try {
    themeContext = useThemeContext();
  } catch (error) {
    // Theme context not available, will use next-themes directly
  }

  // Check if user is authenticated
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        setIsAuthenticated(!!data.session);
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Only show the toggle after mounting to avoid hydration mismatch
  React.useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-9 h-9" />; // Placeholder with same size

  // Handle theme toggle
  const toggleTheme = async () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";

    // If theme context is available and user is authenticated, use it
    if (themeContext && isAuthenticated) {
      themeContext.setTheme(newTheme);

      // Update theme in database
      try {
        await fetch("/api/settings/update-theme", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ theme: newTheme }),
        });
      } catch (error) {
        console.error("Error updating theme in database:", error);
      }
    } else {
      // Fall back to next-themes for non-authenticated users
      setNextTheme(newTheme);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  // Check if user is authenticated
  React.useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        if (isMounted) {
          setIsAuthenticated(!!data.session);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        if (isMounted) {
          setIsAuthenticated(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Only show the toggle after mounting to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  const handleThemeChange = async () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";

    // Update theme locally
    setTheme(newTheme);

    // If user is authenticated, sync theme to database
    if (isAuthenticated) {
      try {
        // Use the sync-theme API endpoint to update the theme in the database
        await fetch("/api/settings/sync-theme", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ theme: newTheme }),
        });
      } catch (error) {
        console.error("Error syncing theme to database:", error);
      }
    }
  };

  if (!mounted) return <div className="w-9 h-9" />; // Placeholder with same size

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleThemeChange}
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

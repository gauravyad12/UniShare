"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/utils/supabase/client";
import {
  applyThemeToDocument,
  saveThemeToStorage,
  broadcastThemeChange,
} from "@/lib/theme-utils";

type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  saveSettings: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  accentColor: "default",
  setAccentColor: () => {},
  fontSize: 2,
  setFontSize: () => {},
  saveSettings: async () => {},
});

// Define public routes that should not have custom styling
const PUBLIC_ROUTES = [
  "/",
  "/universities",
  "/academic-integrity",
  "/copyright-policy",
  "/terms-of-service",
  "/pricing",
  "/sign-in",
  "/sign-up",
  "/verify-invite",
  "/forgot-password",
];

// Define route prefixes that indicate dashboard/authenticated routes
const DASHBOARD_PREFIXES = ["/dashboard"];

// Function to check if current path is a public route
function isPublicRoute(pathname: string): boolean {
  // Check exact matches first
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }

  // Check if it's a dashboard route
  if (DASHBOARD_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return false;
  }

  // If it's a profile page under /profile/@username, it's public
  if (pathname.startsWith("/profile/@")) {
    return true;
  }

  // Default to treating unknown routes as public for safety
  return true;
}

export function ThemeContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme: nextTheme, setTheme: setNextTheme } = useTheme();
  const [accentColor, setAccentColorState] = useState("default");
  const [fontSize, setFontSizeState] = useState(2);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState("/");
  const [isPublic, setIsPublic] = useState(true);
  const [userTheme, setUserTheme] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Refs for debouncing and tracking theme changes
  const themeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const routeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isThemeChangingRef = useRef(false);
  const isRouteThemeChangingRef = useRef(false);
  const lastAppliedThemeRef = useRef<string | null>(null);
  const lastAppliedRouteRef = useRef<string | null>(null);
  const themeChangeCountRef = useRef(0);
  const routeChangeCountRef = useRef(0);

  // Debounced function to apply theme changes
  const debouncedApplyTheme = (theme: string, color: string, size: number, source: string) => {
    // Clear any pending timeout
    if (themeChangeTimeoutRef.current) {
      clearTimeout(themeChangeTimeoutRef.current);
    }

    // Increment change count for logging
    themeChangeCountRef.current += 1;
    const changeId = themeChangeCountRef.current;

    // Skip if this is the same theme we just applied
    if (lastAppliedThemeRef.current === theme && !isThemeChangingRef.current) {
      console.log(`Theme change ${changeId} from ${source} skipped - already applied: ${theme}`);
      return;
    }

    console.log(`Theme change ${changeId} from ${source} scheduled: ${theme}`);

    // Set flag to indicate theme is changing
    isThemeChangingRef.current = true;

    // Debounce theme application
    themeChangeTimeoutRef.current = setTimeout(() => {
      console.log(`Theme change ${changeId} from ${source} applying: ${theme}`);

      // Apply theme
      applyThemeToDocument(theme, color, size);

      // Update last applied theme
      lastAppliedThemeRef.current = theme;

      // Reset flag
      isThemeChangingRef.current = false;

      console.log(`Theme change ${changeId} from ${source} complete: ${theme}`);
    }, 50); // Short delay to batch rapid changes
  };

  // Custom setTheme that preserves user preference
  const setTheme = (newTheme: string) => {
    setUserTheme(newTheme);
    setNextTheme(newTheme);
    saveThemeToStorage(newTheme);

    // Use debounced theme application
    debouncedApplyTheme(newTheme, accentColor, fontSize, 'setTheme');
  };

  // Check if user is authenticated
  useEffect(() => {
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

  // Update current path when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const updatePath = () => {
        const newPath = window.location.pathname;
        if (newPath !== currentPath) {
          setCurrentPath(newPath);
          const newIsPublic = isPublicRoute(newPath);
          setIsPublic(newIsPublic);

          // Apply appropriate styling based on route type using debounced function
          debouncedApplyThemeBasedOnRoute(newIsPublic, 'pathChange');
        }
      };

      // Set initial path
      updatePath();

      // Listen for path changes
      window.addEventListener("popstate", updatePath);

      // Create a MutationObserver to detect Next.js client-side navigation
      const observer = new MutationObserver(() => {
        if (window.location.pathname !== currentPath) {
          updatePath();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      return () => {
        window.removeEventListener("popstate", updatePath);
        observer.disconnect();

        // Clean up any pending route change timeout
        if (routeChangeTimeoutRef.current) {
          clearTimeout(routeChangeTimeoutRef.current);
          routeChangeTimeoutRef.current = null;
        }
      };
    }
  }, [currentPath]);

  // Debounced function to apply theme based on route type
  const debouncedApplyThemeBasedOnRoute = (isPublicRoute: boolean, source: string) => {
    // Clear any pending route change timeout
    if (routeChangeTimeoutRef.current) {
      clearTimeout(routeChangeTimeoutRef.current);
    }

    // Increment route change count for logging
    routeChangeCountRef.current += 1;
    const changeId = routeChangeCountRef.current;

    // Create a unique identifier for this route state
    const routeStateId = `${isPublicRoute ? 'public' : 'private'}-${userTheme || nextTheme || 'system'}`;

    // Skip if this is the same route state we just applied
    if (lastAppliedRouteRef.current === routeStateId && !isRouteThemeChangingRef.current) {
      console.log(`Route theme change ${changeId} from ${source} skipped - already applied: ${routeStateId}`);
      return;
    }

    console.log(`Route theme change ${changeId} from ${source} scheduled: ${routeStateId}`);

    // Set flag to indicate route theme is changing
    isRouteThemeChangingRef.current = true;

    // Debounce route theme application
    routeChangeTimeoutRef.current = setTimeout(() => {
      console.log(`Route theme change ${changeId} from ${source} applying: ${routeStateId}`);

      // Apply theme based on route type
      applyThemeBasedOnRouteInternal(isPublicRoute);

      // Update last applied route state
      lastAppliedRouteRef.current = routeStateId;

      // Reset flag
      isRouteThemeChangingRef.current = false;

      console.log(`Route theme change ${changeId} from ${source} complete: ${routeStateId}`);
    }, 100); // Slightly longer delay for route changes
  };

  // Internal function to actually apply theme based on route type
  const applyThemeBasedOnRouteInternal = (isPublicRoute: boolean) => {
    if (isPublicRoute) {
      // Public routes: reset custom styling but keep theme mode
      // Reset to default styles for public routes
      document.documentElement.removeAttribute("data-accent");
      document.documentElement.style.fontSize = "16px";
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--ring");

      // Remove dashboard-specific class if present
      const dashboardElements = document.querySelectorAll(".dashboard-styles");
      dashboardElements.forEach((el) => {
        if (el.classList.contains("dashboard-styles")) {
          el.classList.remove("dashboard-styles");
          // Also remove any inline styles that might have been applied
          el.removeAttribute("style");
        }
      });

      // Keep dark/light mode preference
      if (userTheme) {
        setNextTheme(userTheme);
        // Directly apply dark/light mode
        if (userTheme === "dark") {
          document.documentElement.classList.add("dark");
          document.documentElement.classList.remove("light");
        } else if (userTheme === "light") {
          document.documentElement.classList.add("light");
          document.documentElement.classList.remove("dark");
        }
      }
    } else if (isAuthenticated) {
      // Dashboard/authenticated routes: apply custom styling
      applyThemeToDocument(
        userTheme || nextTheme || "system",
        accentColor,
        fontSize,
      );

      // Make sure the dashboard container has the data-accent attribute and font size
      const dashboardContainer = document.querySelector(".dashboard-styles");
      if (dashboardContainer) {
        // Apply accent color
        if (accentColor !== "default") {
          dashboardContainer.setAttribute("data-accent", accentColor);
        } else {
          dashboardContainer.removeAttribute("data-accent");
        }

        // Apply font size
        const rootSize = 16 + (fontSize - 2) * 1;
        dashboardContainer.style.fontSize = `${rootSize}px`;
        // Also apply to html for consistent sizing
        document.documentElement.style.fontSize = `${rootSize}px`;
      }
    }
  };

  // Fetch user settings when authenticated
  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        if (!isAuthenticated) {
          setIsLoading(false);
          return;
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: settings } = await supabase
            .from("user_settings")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (settings) {
            if (settings.theme_preference) {
              setUserTheme(settings.theme_preference);
              setNextTheme(settings.theme_preference);
              // Ensure theme is immediately applied
              saveThemeToStorage(settings.theme_preference);
            }
            if (settings.color_scheme) {
              setAccentColorState(settings.color_scheme);
            }
            if (settings.font_size) {
              setFontSizeState(settings.font_size);
            }

            // Apply settings immediately after fetching using debounced function
            if (!isPublic) {
              debouncedApplyTheme(
                settings.theme_preference || "system",
                settings.color_scheme || "default",
                settings.font_size || 2,
                'fetchUserSettings'
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserSettings();
  }, [isAuthenticated, setNextTheme, isPublic]);

  // Apply settings when they change or authentication status changes
  useEffect(() => {
    if (!isLoading) {
      // Only apply custom styling on dashboard pages
      if (!isPublic && isAuthenticated) {
        debouncedApplyTheme(
          userTheme || nextTheme || "system",
          accentColor,
          fontSize,
          'settingsChangeEffect'
        );
      } else {
        // For public routes, use the debounced route-based theme application
        debouncedApplyThemeBasedOnRoute(isPublic, 'settingsChangeEffect');
      }
    }
  }, [
    isLoading,
    isPublic,
    accentColor,
    fontSize,
    userTheme,
    nextTheme,
    isAuthenticated,
  ]);

  const setAccentColor = (color: string) => {
    setAccentColorState(color);

    // Use debounced theme application
    debouncedApplyTheme(userTheme || nextTheme || "system", color, fontSize, 'setAccentColor');
  };

  const setFontSize = (size: number) => {
    setFontSizeState(size);

    // Use debounced theme application
    debouncedApplyTheme(userTheme || nextTheme || "system", accentColor, size, 'setFontSize');
  };

  const saveSettings = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch("/api/settings/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          theme_preference: userTheme || nextTheme,
          color_scheme: accentColor,
          font_size: fontSize,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        console.error("Failed to save settings:", data.error);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  // Disabled automatic saving - settings will only be saved when explicitly called
  // useEffect(() => {
  //   if (!isLoading && !isPublic && isAuthenticated) {
  //     const saveTimeout = setTimeout(() => {
  //       saveSettings();
  //     }, 500);
  //     return () => clearTimeout(saveTimeout);
  //   }
  // }, [userTheme, accentColor, fontSize, isLoading, isPublic, isAuthenticated]);

  // Listen for theme changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme" && e.newValue) {
        setUserTheme(e.newValue);
        setNextTheme(e.newValue);

        // Apply theme changes using debounced function
        debouncedApplyTheme(e.newValue, accentColor, fontSize, 'storageEvent-theme');
      } else if (e.key === "accent-color" && e.newValue) {
        setAccentColorState(e.newValue);

        // Apply accent color using debounced function
        debouncedApplyTheme(
          userTheme || nextTheme || "system",
          e.newValue,
          fontSize,
          'storageEvent-accent'
        );
      } else if (e.key === "font-size" && e.newValue) {
        const size = parseInt(e.newValue, 10);
        if (!isNaN(size)) {
          setFontSizeState(size);

          // Apply font size using debounced function
          debouncedApplyTheme(
            userTheme || nextTheme || "system",
            accentColor,
            size,
            'storageEvent-fontSize'
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Check localStorage for stored values on all routes
    if (typeof localStorage !== 'undefined') {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme && storedTheme !== nextTheme) {
        setUserTheme(storedTheme);
        setNextTheme(storedTheme);
      }

      const storedAccentColor = localStorage.getItem("accent-color");
      if (storedAccentColor) {
        setAccentColorState(storedAccentColor);
      }

      const storedFontSize = localStorage.getItem("font-size");
      if (storedFontSize) {
        const size = parseInt(storedFontSize, 10);
        if (!isNaN(size)) {
          setFontSizeState(size);
        }
      }
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);

      // Clean up any pending theme change timeout
      if (themeChangeTimeoutRef.current) {
        clearTimeout(themeChangeTimeoutRef.current);
        themeChangeTimeoutRef.current = null;
      }

      // Clean up any pending route change timeout
      if (routeChangeTimeoutRef.current) {
        clearTimeout(routeChangeTimeoutRef.current);
        routeChangeTimeoutRef.current = null;
      }
    };
  }, [
    accentColor,
    fontSize,
    isPublic,
    isAuthenticated,
    setNextTheme,
    nextTheme,
    userTheme,
  ]);

  // Listen for system theme changes
  useEffect(() => {
    // Only add listener if theme is set to "system"
    if ((userTheme || nextTheme) !== "system") return;

    try {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      // Handler for system theme changes
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        console.log("System theme changed:", e.matches ? "dark" : "light");

        // Apply the new system theme immediately to prevent flash
        if (e.matches) {
          document.documentElement.classList.add("dark");
          document.documentElement.classList.remove("light");
        } else {
          document.documentElement.classList.add("light");
          document.documentElement.classList.remove("dark");
        }

        // Re-apply all theme settings to ensure consistency using debounced function
        debouncedApplyTheme("system", accentColor, fontSize, 'systemThemeChange');
      };

      // Add listener for system theme changes
      mediaQuery.addEventListener("change", handleSystemThemeChange);

      return () => {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);

        // Clean up any pending theme change timeout
        if (themeChangeTimeoutRef.current) {
          clearTimeout(themeChangeTimeoutRef.current);
          themeChangeTimeoutRef.current = null;
        }

        // Clean up any pending route change timeout
        if (routeChangeTimeoutRef.current) {
          clearTimeout(routeChangeTimeoutRef.current);
          routeChangeTimeoutRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error setting up system theme listener:", error);
    }
  }, [userTheme, nextTheme, accentColor, fontSize]);

  return (
    <ThemeContext.Provider
      value={{
        theme: userTheme || nextTheme || "system",
        setTheme,
        accentColor,
        setAccentColor,
        fontSize,
        setFontSize,
        saveSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useThemeContext = () => useContext(ThemeContext);

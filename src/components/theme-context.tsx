"use client";

import { createContext, useContext, useEffect, useState } from "react";
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

  // Custom setTheme that preserves user preference
  const setTheme = (newTheme: string) => {
    setUserTheme(newTheme);
    setNextTheme(newTheme);
    saveThemeToStorage(newTheme);

    // Always apply theme to document for immediate effect, regardless of route
    applyThemeToDocument(newTheme, accentColor, fontSize);
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

          // Apply appropriate styling based on route type
          applyThemeBasedOnRoute(newIsPublic);
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
      };
    }
  }, [currentPath]);

  // Apply theme based on route type
  const applyThemeBasedOnRoute = (isPublicRoute: boolean) => {
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

            // Apply settings immediately after fetching
            if (!isPublic) {
              applyThemeToDocument(
                settings.theme_preference || "system",
                settings.color_scheme || "default",
                settings.font_size || 2,
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
        applyThemeToDocument(
          userTheme || nextTheme || "system",
          accentColor,
          fontSize,
        );
      } else {
        applyThemeBasedOnRoute(isPublic);
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

    // Always apply accent color for immediate effect, regardless of route
    applyThemeToDocument(userTheme || nextTheme || "system", color, fontSize);
  };

  const setFontSize = (size: number) => {
    setFontSizeState(size);

    // Always apply font size for immediate effect, regardless of route
    applyThemeToDocument(
      userTheme || nextTheme || "system",
      accentColor,
      size,
    );
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

        // Always apply theme changes immediately
        applyThemeToDocument(e.newValue, accentColor, fontSize);
      } else if (e.key === "accent-color" && e.newValue) {
        setAccentColorState(e.newValue);

        // Apply accent color immediately
        applyThemeToDocument(userTheme || nextTheme || "system", e.newValue, fontSize);
      } else if (e.key === "font-size" && e.newValue) {
        const size = parseInt(e.newValue, 10);
        if (!isNaN(size)) {
          setFontSizeState(size);

          // Apply font size immediately
          applyThemeToDocument(userTheme || nextTheme || "system", accentColor, size);
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

    return () => window.removeEventListener("storage", handleStorageChange);
  }, [
    accentColor,
    fontSize,
    isPublic,
    isAuthenticated,
    setNextTheme,
    nextTheme,
    userTheme,
  ]);

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

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/utils/supabase/client";

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
      document.documentElement.style.removeProperty("--accent-color");
      document.documentElement.removeAttribute("data-accent");
      document.documentElement.style.fontSize = "16px";

      // Keep dark/light mode preference
      if (userTheme) {
        setNextTheme(userTheme);
      }
    } else if (isAuthenticated) {
      // Dashboard/authenticated routes: apply custom styling
      applyAccentColor(accentColor);
      applyFontSize(fontSize);
      if (userTheme) {
        setNextTheme(userTheme);
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
            }
            if (settings.color_scheme) {
              setAccentColorState(settings.color_scheme);
            }
            if (settings.font_size) {
              setFontSizeState(settings.font_size);
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
  }, [isAuthenticated, setNextTheme]);

  // Apply settings when they change or authentication status changes
  useEffect(() => {
    if (!isLoading) {
      applyThemeBasedOnRoute(isPublic);
    }
  }, [isLoading, isPublic, accentColor, fontSize, userTheme, isAuthenticated]);

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    if (!isPublic && isAuthenticated) {
      applyAccentColor(color);
    }
  };

  const applyAccentColor = (color: string) => {
    if (color === "default") {
      // Reset to system defaults for the default option
      document.documentElement.style.removeProperty("--accent-color");
      document.documentElement.removeAttribute("data-accent");
    } else {
      document.documentElement.style.setProperty(
        "--accent-color",
        getColorValue(color),
      );
      document.documentElement.setAttribute("data-accent", color);
    }
  };

  const setFontSize = (size: number) => {
    setFontSizeState(size);
    if (!isPublic && isAuthenticated) {
      applyFontSize(size);
    }
  };

  const applyFontSize = (size: number) => {
    const rootSize = 16 + (size - 2) * 1; // Base size is 16px, each step changes by 1px
    document.documentElement.style.fontSize = `${rootSize}px`;
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

  // Save settings when they change, but only when authenticated and on dashboard pages
  useEffect(() => {
    if (!isLoading && !isPublic && isAuthenticated) {
      const saveTimeout = setTimeout(() => {
        saveSettings();
      }, 500);
      return () => clearTimeout(saveTimeout);
    }
  }, [userTheme, accentColor, fontSize, isLoading, isPublic, isAuthenticated]);

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

"use client";

import { ReactNode, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import Link from "next/link";
import { useThemeContext } from "./theme-context";
import { useTheme } from "next-themes";
import { applyThemeToDocument } from "@/lib/theme-utils";

interface DashboardClientWrapperProps {
  children: ReactNode;
  initialAuthState?: boolean;
  initialFontSize?: number;
  initialAccentColor?: string;
}

export function DashboardClientWrapper({
  children,
  initialAuthState = false,
  initialFontSize = 2,
  initialAccentColor = "default",
}: DashboardClientWrapperProps) {
  const [isLoading, setIsLoading] = useState(!initialAuthState);
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthState);
  const router = useRouter();

  // Safely access theme context with fallback
  let themeContext;
  try {
    themeContext = useThemeContext();
  } catch (error) {
    // If theme context is not available, create a fallback
    themeContext = {
      setFontSize: () => {},
      setAccentColor: () => {},
    };
  }

  // Destructure with fallbacks
  const { setFontSize = () => {}, setAccentColor = () => {} } = themeContext || {};

  // Fallback to next-themes for basic theme functionality
  const { theme, setTheme } = useTheme();

  // Initialize theme settings from server props
  useEffect(() => {
    try {
      if (initialFontSize) {
        // Try to use context if available
        if (typeof setFontSize === 'function') {
          setFontSize(initialFontSize);
        }

        // Apply font size directly to document for immediate effect
        const rootSize = 16 + (initialFontSize - 2) * 1;
        if (typeof document !== 'undefined') {
          document.documentElement.style.fontSize = `${rootSize}px`;
          // Also apply to any dashboard container that might exist
          const dashboardContainer = document.querySelector(".dashboard-styles");
          if (dashboardContainer) {
            dashboardContainer.style.fontSize = `${rootSize}px`;
          }
        }
      }

      if (initialAccentColor) {
        // Try to use context if available
        if (typeof setAccentColor === 'function') {
          setAccentColor(initialAccentColor);
        }

        // Apply accent color directly if needed
        if (typeof document !== 'undefined') {
          try {
            // Apply theme directly using the utility function
            applyThemeToDocument(
              theme || 'system',
              initialAccentColor,
              initialFontSize
            );
          } catch (error) {
            console.error("Error applying theme:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error initializing theme settings:", error);
    }
  }, [initialFontSize, initialAccentColor, setFontSize, setAccentColor, theme]);

  useEffect(() => {
    if (initialAuthState) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();

        if (data.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push("/sign-in?error=Please sign in to access the dashboard");
        }
      } catch (error) {
        setIsAuthenticated(false);
        router.push(
          "/sign-in?error=Authentication error. Please sign in again.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Set up auth state change listener
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsAuthenticated(true);
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        router.push("/sign-in");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, initialAuthState]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col gap-8 items-center justify-center min-h-[60vh]">
        <h1 className="text-3xl font-bold">Please sign in</h1>
        <p className="text-muted-foreground">
          You need to be signed in to view this page
        </p>
        <Button asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

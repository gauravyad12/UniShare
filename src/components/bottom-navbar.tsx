"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, User, BookOpen, Settings, Plus, X } from "lucide-react";
import { useThemeContext } from "./theme-context";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import MobileActionPopup from "./mobile-action-popup";
import { Button } from "./ui/button";

export default function BottomNavbar() {
  const pathname = usePathname();
  const { accentColor, theme } = useThemeContext();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const supabase = createClient();

  // Handle scroll effect for shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Define navigation items with their paths, icons, and labels
  const navItems = [
    {
      path: "/dashboard",
      icon: Home,
      label: "Home",
    },
    {
      path: "/dashboard/resources",
      icon: BookOpen,
      label: "Resources",
    },
    {
      // This is a placeholder for the action button
      path: "#action",
      icon: () => null, // Empty icon as we'll render the action popup separately
      label: "",
    },
    {
      path: "/dashboard/profile/edit",
      icon: User,
      label: "Profile",
    },
    {
      path: "/dashboard/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  // Determine active indicator styles based on accent color
  const getActiveIndicatorStyle = () => {
    if (accentColor === "default") return "bg-primary";

    // Map accent colors to their CSS variable equivalents
    const accentColorMap: Record<string, string> = {
      blue: "bg-[hsl(var(--primary))]",
      green: "bg-[hsl(var(--primary))]",
      purple: "bg-[hsl(var(--primary))]",
      pink: "bg-[hsl(var(--primary))]",
      yellow: "bg-[hsl(var(--primary))]",
      orange: "bg-[hsl(var(--primary))]",
    };

    return accentColorMap[accentColor] || "bg-primary";
  };

  return (
    <>
      {/* Action popup component - don't render the button here */}
      <MobileActionPopup
        renderButton={false}
        isOpen={isActionOpen}
        onToggle={() => setIsActionOpen(!isActionOpen)}
      />

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border md:hidden safe-area-bottom ${isScrolled ? "shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)]" : ""}`}
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        }}
      >
        <nav className="flex justify-around items-center h-16 px-1 max-w-screen-lg mx-auto">
          {navItems.map((item) => {
            // Render the action button in the center
            if (item.path === "#action") {
              return (
                <div key="action-placeholder" className="relative w-full h-full flex items-center justify-center">
                  <Button
                    onClick={() => setIsActionOpen(!isActionOpen)}
                    size="icon"
                    className="rounded-full shadow-md h-14 w-14 bg-primary hover:bg-primary/90 -mt-6 absolute bottom-3 transform transition-transform duration-200 ease-in-out hover:scale-105"
                  >
                    {isActionOpen ? (
                      <X className="h-6 w-6 text-primary-foreground" />
                    ) : (
                      <Plus className="h-6 w-6 text-primary-foreground" />
                    )}
                  </Button>
                </div>
              );
            }

            // Standard check for paths
            const isActive = pathname === item.path ||
              (pathname.startsWith(`${item.path}/`) && item.path !== "/dashboard") ||
              // Special case for profile edit path
              (item.label === "Profile" && pathname === "/dashboard/profile/edit") ||
              // Special case for settings path
              (item.label === "Settings" && pathname.startsWith("/dashboard/settings"));

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground active:text-primary/70"}`}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <span
                    className={`absolute top-0 h-1 w-10 rounded-full ${getActiveIndicatorStyle()}`}
                    aria-hidden="true"
                  />
                )}
                <item.icon
                  size={isActive ? 22 : 20}
                  className={`transition-all duration-200 ${isActive ? "mb-0.5" : "mb-1 opacity-80"}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`text-xs font-medium transition-all duration-200 ${isActive ? "scale-105" : ""}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

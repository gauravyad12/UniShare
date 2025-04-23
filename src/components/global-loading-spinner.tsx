"use client";

import { useLayoutEffect, useState, useRef } from "react";
import LoadingSpinner from "./loading-spinner";

export default function GlobalLoadingSpinner() {
  const [isLoading, setIsLoading] = useState(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use useLayoutEffect to avoid useInsertionEffect error
  useLayoutEffect(() => {
    const handleStart = () => {
      // Clear any existing timeout to prevent race conditions
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      setIsLoading(true);
    };

    const handleComplete = () => {
      // No delay, hide spinner immediately
      setIsLoading(false);
    };

    // Listen for both custom events and Next.js events
    document.addEventListener("navigationStart", handleStart);
    document.addEventListener("navigationComplete", handleComplete);
    document.addEventListener("nextjs:route-change-start", handleStart);
    document.addEventListener("nextjs:route-change-complete", handleComplete);

    // Also handle link clicks directly
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Skip if the click is on or inside a scroll-link element
      if (target.closest('.scroll-link')) {
        return;
      }

      const link = target.closest("a");
      if (
        link &&
        link.href &&
        !link.target &&
        !link.hasAttribute("download") &&
        link.hostname === window.location.hostname &&
        !link.classList.contains('scroll-link') // Also check the link itself
      ) {
        handleStart();
      }
    };

    document.addEventListener("click", handleLinkClick);

    // Clean up function
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      document.removeEventListener("navigationStart", handleStart);
      document.removeEventListener("navigationComplete", handleComplete);
      document.removeEventListener("nextjs:route-change-start", handleStart);
      document.removeEventListener(
        "nextjs:route-change-complete",
        handleComplete,
      );
      document.removeEventListener("click", handleLinkClick);
    };
  }, []);

  return isLoading ? (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <LoadingSpinner />
    </div>
  ) : null;
}

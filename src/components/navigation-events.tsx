"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useLayoutEffect, useEffect } from "react";

export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Use useLayoutEffect instead of useEffect to avoid useInsertionEffect error
  useLayoutEffect(() => {
    const handleStart = () => {
      document.dispatchEvent(new Event("nextjs:route-change-start"));
    };

    const handleComplete = () => {
      document.dispatchEvent(new Event("nextjs:route-change-complete"));
    };

    // Dispatch custom events for navigation
    document.addEventListener("navigationStart", handleStart);
    document.addEventListener("navigationComplete", handleComplete);

    // Also dispatch events on initial load and route changes
    handleComplete(); // Ensure we complete on initial load

    return () => {
      document.removeEventListener("navigationStart", handleStart);
      document.removeEventListener("navigationComplete", handleComplete);
    };
  }, []);

  // Reset navigation state when the route changes
  // Use useLayoutEffect to ensure this runs before rendering
  useLayoutEffect(() => {
    document.dispatchEvent(new Event("nextjs:route-change-complete"));
  }, [pathname, searchParams]);

  return null;
}

"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "./loading-spinner";

export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const handleStart = () => {
      setIsNavigating(true);
    };

    const handleComplete = () => {
      setIsNavigating(false);
    };

    document.addEventListener("navigationStart", handleStart);
    document.addEventListener("navigationComplete", handleComplete);

    return () => {
      document.removeEventListener("navigationStart", handleStart);
      document.removeEventListener("navigationComplete", handleComplete);
    };
  }, []);

  // Reset navigation state when the route changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  return isNavigating ? <LoadingSpinner /> : null;
}

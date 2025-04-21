"use client";

import { useEffect, useState } from "react";

// This component safely gets URL search parameters without using useSearchParams
export default function SafeSearchParams({
  onParamsChange,
}: {
  onParamsChange: (params: URLSearchParams) => void;
}) {
  // Only run on client side
  useEffect(() => {
    // Get search params from window.location
    const params = new URLSearchParams(window.location.search);
    onParamsChange(params);

    // Listen for URL changes
    const handleUrlChange = () => {
      const newParams = new URLSearchParams(window.location.search);
      onParamsChange(newParams);
    };

    // Add event listener for popstate (browser back/forward)
    window.addEventListener("popstate", handleUrlChange);

    // Clean up
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, [onParamsChange]);

  return null;
}

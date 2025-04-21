"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// This component will only be rendered on the client side
function SearchParamsReader() {
  const [mounted, setMounted] = useState(false);

  // Only use useSearchParams after component is mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only access useSearchParams when component is mounted
  if (mounted) {
    try {
      // This will throw an error during static rendering
      // but will work fine during client-side rendering
      useSearchParams();
    } catch (e) {
      // Silently catch any errors
      console.error("SearchParams error (safe to ignore):", e);
    }
  }

  return null;
}

// Wrap the component in a Suspense boundary
export default function ClientOnlySearchParams() {
  return (
    <Suspense fallback={null}>
      <SearchParamsReader />
    </Suspense>
  );
}

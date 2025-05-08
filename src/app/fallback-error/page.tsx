"use client";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import FallbackError from "../fallback-error";
import { useState, useCallback, Suspense } from "react";
import { SearchParamsProvider } from "@/components/search-params-wrapper";

function FallbackErrorPageContent() {
  // State for search params
  const [params, setParams] = useState<URLSearchParams | null>(null);

  // Callback to handle search params changes
  const handleParamsChange = useCallback((newParams: URLSearchParams) => {
    setParams(newParams);
  }, []);

  return (
    <>
      <SearchParamsProvider onParamsChange={handleParamsChange} />
      <FallbackError />
    </>
  );
}

// Export the page component with Suspense
export default function FallbackErrorPage() {
  return (
    <Suspense fallback={<div>Loading fallback error page...</div>}>
      <FallbackErrorPageContent />
    </Suspense>
  );
}

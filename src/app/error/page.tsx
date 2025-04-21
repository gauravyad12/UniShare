"use client";

export const dynamic = "force-dynamic";

import ErrorComponent from "../error";
import { useState, useCallback, Suspense } from "react";
import { SearchParamsProvider } from "@/components/search-params-wrapper";

export default function ErrorPage() {
  // State for search params
  const [params, setParams] = useState<URLSearchParams | null>(null);

  // Callback to handle search params changes
  const handleParamsChange = useCallback((newParams: URLSearchParams) => {
    setParams(newParams);
  }, []);

  return (
    <>
      <SearchParamsProvider onParamsChange={handleParamsChange} />
      <ErrorComponent
        error={new Error("Error page accessed directly")}
        reset={() => (window.location.href = "/")}
      />
    </>
  );
}

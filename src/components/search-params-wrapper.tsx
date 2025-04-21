"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

interface SearchParamsProps {
  onParamsChange: (params: URLSearchParams) => void;
}

// Component that uses useSearchParams and passes the result to a callback
function SearchParamsComponent({ onParamsChange }: SearchParamsProps) {
  const params = useSearchParams();
  
  useEffect(() => {
    if (params) {
      onParamsChange(params);
    }
  }, [params, onParamsChange]);
  
  return null;
}

// Wrapper component that handles the Suspense boundary
export function SearchParamsProvider({ onParamsChange }: SearchParamsProps) {
  return (
    <Suspense fallback={null}>
      <SearchParamsComponent onParamsChange={onParamsChange} />
    </Suspense>
  );
}

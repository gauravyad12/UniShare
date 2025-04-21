'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// This component uses useSearchParams and passes the result to a callback
function SearchParamsComponent({ 
  onParamsChange 
}: { 
  onParamsChange: (params: URLSearchParams) => void 
}) {
  const searchParams = useSearchParams();
  
  // Call the callback with the search params
  if (searchParams) {
    onParamsChange(searchParams);
  }
  
  return null;
}

// This is a wrapper component that properly handles Suspense
export default function SuspenseSearchParams({
  onParamsChange,
  fallback = null
}: {
  onParamsChange: (params: URLSearchParams) => void;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      <SearchParamsComponent onParamsChange={onParamsChange} />
    </Suspense>
  );
}

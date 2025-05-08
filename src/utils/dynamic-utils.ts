"use client";

import { Suspense, ReactNode } from 'react';

// Force dynamic rendering for all pages that use this
export const dynamic = "force-dynamic";

// Wrapper component to properly handle Suspense for components that use useSearchParams
export function DynamicWrapper({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {children}
    </Suspense>
  );
}

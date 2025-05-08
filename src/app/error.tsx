"use client";

import { Suspense } from "react";
import ErrorClient from "@/components/error-client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Suspense fallback={<div>Loading error page...</div>}>
      <ErrorClient error={error} reset={reset} />
    </Suspense>
  );
}

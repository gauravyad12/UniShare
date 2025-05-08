import { Suspense } from "react";
import FallbackErrorClient from "@/components/fallback-error-client";

export default function FallbackError() {
  return (
    <Suspense fallback={<div>Loading fallback error page...</div>}>
      <FallbackErrorClient />
    </Suspense>
  );
}

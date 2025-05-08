import { Suspense } from "react";
import NotFoundClient from "@/components/not-found-client";

export default function NotFound() {
  return (
    <Suspense fallback={<div>Loading 404 page...</div>}>
      <NotFoundClient />
    </Suspense>
  );
}

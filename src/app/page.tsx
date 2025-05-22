// This is a server component
import { Suspense } from "react";
import HomeClient from "@/components/home-client";

// Export the page component with Suspense
export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeClient />
    </Suspense>
  );
}

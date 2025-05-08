"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the edit profile page
    router.push("/dashboard/profile/edit");
  }, [router]);

  // Show a loading indicator while redirecting
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Redirecting to profile editor...</p>
    </div>
  );
}

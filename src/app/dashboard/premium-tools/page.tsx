"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PremiumToolsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new Tools page
    router.replace("/dashboard/tools");
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Redirecting to Tools...</p>
    </div>
  );
}

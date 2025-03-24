"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    console.log("Error boundary triggered:", error);
    setErrorMessage(
      error?.message || "An unexpected error occurred. Please try again later.",
    );
  }, [error]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="w-full border-b border-border bg-background py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">UniShare</span>
          </Link>
        </div>
      </nav>
      <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
        <h1 className="text-6xl font-bold">Error</h1>
        <h2 className="mt-4 text-2xl font-semibold">Something went wrong</h2>
        <p className="mt-2 text-muted-foreground max-w-md">{errorMessage}</p>
        <div className="mt-8 flex gap-4">
          <Button onClick={() => reset()} variant="outline">
            Try Again
          </Button>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

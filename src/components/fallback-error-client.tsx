"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { useState, useCallback } from "react";
import SuspenseSearchParams from "@/components/suspense-search-params";

export default function FallbackErrorClient() {
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleParamsChange = useCallback((params: URLSearchParams) => {
    // Get error message from URL params
    const message = params.get("message");
    setErrorMessage(
      message || "An unexpected error occurred. Please try again later.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SuspenseSearchParams onParamsChange={handleParamsChange} fallback={null} />
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
        <h2 className="mt-4 text-2xl font-semibold">Connection Error</h2>
        <p className="mt-2 text-muted-foreground max-w-md">{errorMessage}</p>
        <div className="mt-8 flex gap-4">
          <Button onClick={() => window.location.reload()} variant="outline">
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

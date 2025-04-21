"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import { useState, useCallback } from "react";
import SuspenseSearchParams from "@/components/suspense-search-params";

export default function NotFound() {
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleParamsChange = useCallback((params: URLSearchParams) => {
    // Get error message from URL params
    const error = params.get("error");
    setErrorMessage(
      error || "The page you are looking for doesn't exist or has been moved.",
    );
  }, []);

  return (
    <>
      <SuspenseSearchParams onParamsChange={handleParamsChange} fallback={<div>Loading...</div>} />
      <Navbar />
      <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
        <h1 className="text-6xl font-bold">404</h1>
        <h2 className="mt-4 text-2xl font-semibold">Page Not Found</h2>
        <p className="mt-2 text-muted-foreground">{errorMessage}</p>
        <div className="mt-8 flex gap-4">
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Error({
  error,
  reset,
}: {
  error?: Error & { digest?: string };
  reset?: () => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // Get error message from URL params or from error prop
    const urlMessage = searchParams?.get("message");
    setErrorMessage(
      urlMessage ||
        error?.message ||
        "An unexpected error occurred. Please try again later.",
    );
  }, [searchParams, error]);

  const handleReset = () => {
    if (reset) {
      reset();
    } else {
      // If no reset function is provided, refresh the page
      window.location.href = window.location.pathname;
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
        <h1 className="text-6xl font-bold">Error</h1>
        <h2 className="mt-4 text-2xl font-semibold">Something went wrong</h2>
        <p className="mt-2 text-muted-foreground">{errorMessage}</p>
        <div className="mt-8 flex gap-4">
          <Button onClick={handleReset} variant="outline">
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

// Create a standalone page version for direct navigation
Error.getInitialProps = () => ({ statusCode: 500 });

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function NotFound() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // Get error message from URL params
    const error = searchParams?.get("error");
    setErrorMessage(
      error || "The page you are looking for doesn't exist or has been moved.",
    );
  }, [searchParams]);

  return (
    <>
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

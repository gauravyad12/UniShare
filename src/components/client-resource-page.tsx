"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import ResourceUploadDialog from "./resource-upload-dialog";
import ResourceClientWrapper from "./resource-client-wrapper";
import StyledSearchBarWrapper from "./styled-search-bar-wrapper";
import { useState, useEffect } from "react";
import LoadingSpinner from "./loading-spinner";
import Link from "next/link";

export default function ClientResourcePage({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }
    // Preserve the current tab if it exists
    if (searchParams.has("tab")) {
      params.set("tab", searchParams.get("tab")!);
    }
    router.push(`/dashboard/resources?${params.toString()}`);
  };

  // Set loading state when navigating
  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => {
      // Add a small delay to ensure UI updates properly
      setTimeout(() => setIsLoading(false), 100);
    };

    // Use Next.js router events instead of custom events
    router.events?.on?.("routeChangeStart", handleStart);
    router.events?.on?.("routeChangeComplete", handleComplete);
    router.events?.on?.("routeChangeError", handleComplete);

    // Fallback to custom events if router events aren't available
    window.addEventListener("navigationStart", handleStart);
    window.addEventListener("navigationComplete", handleComplete);

    return () => {
      router.events?.off?.("routeChangeStart", handleStart);
      router.events?.off?.("routeChangeComplete", handleComplete);
      router.events?.off?.("routeChangeError", handleComplete);
      window.removeEventListener("navigationStart", handleStart);
      window.removeEventListener("navigationComplete", handleComplete);
    };
  }, [router]);

  // Initialize loading state based on URL params changes
  useEffect(() => {
    setIsLoading(false);
  }, [searchParams]);

  const closeViewResource = () => {
    setIsLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    router.push(`/dashboard/resources?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          {searchParams.has("view") ? (
            <div className="relative group">
              <h1 className="text-3xl font-bold group-hover:text-primary transition-colors md:group-hover:text-inherit">Resources</h1>
              <Link
                href={`/dashboard/resources${searchParams.has("tab") ? `?tab=${searchParams.get("tab")}` : ''}`}
                className="md:hidden absolute inset-0"
                aria-label="Back to resources"
              />
            </div>
          ) : (
            <h1 className="text-3xl font-bold">Resources</h1>
          )}
          <ResourceUploadDialog />
        </div>
        <div className="w-full">
          <StyledSearchBarWrapper
            placeholder="Search resources by title, course code, or professor..."
            defaultValue={searchQuery}
            baseUrl="/dashboard/resources"
            tabParam={searchParams.get("tab") || undefined}
          />
        </div>
      </header>

      {searchParams.has("view") && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={closeViewResource}>
            Back to Resources
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <ResourceClientWrapper />
          {children}
        </>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { toast } from "@/lib/mobile-aware-toast";

interface DownloadToastOptions {
  title: string;
  status: "downloading" | "success" | "error";
  fallbackMessage?: string;
}

// Function to check if the device is mobile
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  const width = window.innerWidth;
  const hasTouchCapability = 'ontouchstart' in window ||
                            navigator.maxTouchPoints > 0 ||
                            (navigator as any).msMaxTouchPoints > 0;

  // Consider mobile if width is small OR device has touch capability
  return width < 768 || hasTouchCapability;
};

// Main function to show download toast or overlay based on device
export function showDownloadToast({ title, status, fallbackMessage }: DownloadToastOptions): HTMLElement | null {
  // Check if we're on mobile
  const isMobile = isMobileDevice();

  if (isMobile) {
    // On mobile, don't show any notification

    // Clean up any existing overlay
    const existingOverlay = document.getElementById("global-download-overlay");
    if (existingOverlay) {
      document.body.removeChild(existingOverlay);
    }

    return null;
  } else {
    // On desktop, use toast

    if (status === "downloading") {
      toast({
        title: "Downloading",
        description: (
          <div className="flex items-center">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span>Downloading {title}...</span>
          </div>
        ) as any,
        duration: 5000,
      });
    } else if (status === "success") {
      toast({
        title: "Download Complete",
        description: (
          <div className="flex items-center">
            <svg className="mr-2 h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{title} has been downloaded successfully.</span>
          </div>
        ) as any,
        duration: 3000,
      });
    } else if (status === "error") {
      toast({
        title: "Download Failed",
        description: (
          <div className="flex items-center">
            <svg className="mr-2 h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{fallbackMessage || "There was a problem downloading the file."}</span>
          </div>
        ) as any,
        variant: "destructive",
        duration: 3000,
      });
    }

    return null;
  }
}

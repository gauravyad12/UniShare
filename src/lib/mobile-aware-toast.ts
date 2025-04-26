"use client";

import { toast as originalToast } from "@/components/ui/use-toast";

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

// Mobile-aware toast function
export function toast(props: Parameters<typeof originalToast>[0]) {
  // Check if we're on mobile
  if (isMobileDevice()) {
    // Return a dummy object that matches the shape of what the original toast function returns
    return {
      id: "suppressed-toast",
      dismiss: () => {},
      update: () => {},
    };
  }

  // If not on mobile, use the original toast function
  return originalToast(props);
}

// Re-export the useToast hook for convenience
export { useToast } from "@/components/ui/use-toast";

"use client";

import { useEffect, useState } from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastProgress,
} from "./ui/toast";
import { useToast } from "./ui/use-toast";

export function MobileAwareToaster() {
  const { toasts } = useToast();
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const hasTouchCapability = 'ontouchstart' in window ||
                                navigator.maxTouchPoints > 0 ||
                                (navigator as any).msMaxTouchPoints > 0;

      // Consider mobile if width is small OR device has touch capability
      const isMobileView = width < 920 || hasTouchCapability; // lg breakpoint in Tailwind

      setIsMobile(isMobileView);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // If on mobile, don't render any toasts
  if (isMobile) {
    return null;
  }
  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, duration = 5000, ...props }) {
        return (
          <Toast key={id} {...props} className="relative overflow-hidden pb-1">
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
            <ToastProgress duration={duration} />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

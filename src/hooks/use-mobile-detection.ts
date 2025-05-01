"use client";

import { useState, useEffect } from "react";

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return false;
      
      const width = window.innerWidth;
      const hasTouchCapability = 'ontouchstart' in window ||
                                navigator.maxTouchPoints > 0 ||
                                (navigator as any).msMaxTouchPoints > 0;

      // Consider mobile if width is small OR device has touch capability
      const isMobileView = width < 768 || hasTouchCapability;
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

  return isMobile;
}

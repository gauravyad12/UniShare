"use client";

import { useEffect, useState } from "react";
import { Smartphone, RotateCcw, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewportWarningProps {
  minWidth?: number;
  minHeight?: number;
}

export default function ViewportWarning({
  minWidth = 365, // Default minimum width
  minHeight = 400, // Default minimum height
}: ViewportWarningProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isTooNarrow, setIsTooNarrow] = useState(false);
  const [isTooShort, setIsTooShort] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [deviceInfo, setDeviceInfo] = useState({ 
    dpr: 1, 
    isAndroid: false, 
    isIOS: false,
    actualWidth: 0 
  });

  useEffect(() => {
    // Function to get device information
    const getDeviceInfo = () => {
      const dpr = window.devicePixelRatio || 1;
      const userAgent = navigator.userAgent;
      const isAndroid = /Android/i.test(userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      
      return { dpr, isAndroid, isIOS };
    };

    // Function to check viewport dimensions with device-aware logic
    const checkViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const info = getDeviceInfo();
      
      // Calculate actual physical width for comparison
      const actualWidth = width * info.dpr;
      
      // Adjust minimum width based on device type
      let adjustedMinWidth = minWidth;
      
             // Be more lenient for mobile devices, especially Android
       if (info.isAndroid || info.isIOS) {
         // Additional Android-specific adjustments for high-DPR devices
         if (info.isAndroid && width < 360 && actualWidth > 1000) {
           // This is likely a high-DPR Android device reporting low logical width
           // but has sufficient physical width - don't show warning
           adjustedMinWidth = width - 1;
         }
       }

      const tooNarrow = width < adjustedMinWidth;
      const tooShort = height < minHeight;

      setIsTooNarrow(tooNarrow);
      setIsTooShort(tooShort);
      setIsVisible(tooNarrow || tooShort);
      setDimensions({ width, height });
      setDeviceInfo({ ...info, actualWidth });
    };

    // Check on initial load with a small delay to ensure proper initialization
    const timeoutId = setTimeout(checkViewport, 100);

    // Add event listener for resize
    window.addEventListener("resize", checkViewport);
    // Also listen for orientation changes on mobile
    window.addEventListener("orientationchange", () => {
      setTimeout(checkViewport, 500); // Delay after orientation change
    });

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", checkViewport);
      window.removeEventListener("orientationchange", checkViewport);
    };
  }, [minWidth, minHeight]);

  // If viewport is acceptable, don't render anything
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          {isTooNarrow ? (
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Smartphone className="h-20 w-20 text-muted-foreground" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex">
                  <ArrowLeft className="h-5 w-5 text-primary" />
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Smartphone className="h-20 w-20 text-muted-foreground rotate-90" />
                <RotateCcw className="h-6 w-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold mb-2">
          {isTooNarrow
            ? "Screen Too Narrow"
            : "Screen Too Short"}
        </h2>

        <p className="text-muted-foreground mb-6">
          {isTooNarrow
            ? "Please use a device with a wider screen for the best experience."
            : "Please use a device with a taller screen for the best experience."}
        </p>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Current dimensions: {dimensions.width}px × {dimensions.height}px
          </p>
          <p className="text-sm text-muted-foreground">
            Minimum required: {minWidth}px × {minHeight}px
          </p>
        </div>

        <Button
          className="mt-6"
          onClick={() => setIsVisible(false)}
        >
          Continue Anyway
        </Button>
      </div>
    </div>
  );
}

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
  minHeight = 600, // Default minimum height
}: ViewportWarningProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isTooNarrow, setIsTooNarrow] = useState(false);
  const [isTooShort, setIsTooShort] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Function to check viewport dimensions
    const checkViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      const tooNarrow = width < minWidth;
      const tooShort = height < minHeight;

      setIsTooNarrow(tooNarrow);
      setIsTooShort(tooShort);
      setIsVisible(tooNarrow || tooShort);
      setDimensions({ width, height });
    };

    // Check on initial load
    checkViewport();

    // Add event listener for resize
    window.addEventListener("resize", checkViewport);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkViewport);
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

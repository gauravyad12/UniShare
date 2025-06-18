"use client";

import { ReactNode } from "react";
import ViewportWarning from "./viewport-warning";

interface ViewportWarningWrapperProps {
  children: ReactNode;
  minWidth?: number;
  minHeight?: number;
  // New options for better mobile handling
  enableMobileOptimization?: boolean;
  strictMode?: boolean; // If false, be more lenient with mobile devices
}

export default function ViewportWarningWrapper({
  children,
  minWidth = 365, // Default minimum width
  minHeight = 400, // Default minimum height
  enableMobileOptimization = true, // Enable smart mobile detection by default
  strictMode = false, // Be lenient by default
}: ViewportWarningWrapperProps) {
  // Keep original minWidth - mobile optimization happens in ViewportWarning component
  const effectiveMinWidth = minWidth;

  return (
    <>
      <ViewportWarning 
        minWidth={effectiveMinWidth} 
        minHeight={minHeight} 
      />
      {children}
    </>
  );
}

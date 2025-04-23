"use client";

import { useEffect, useState } from "react";

export default function LoadingSpinner() {
  // No delay, show spinner immediately

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      </div>
    </div>
  );
}

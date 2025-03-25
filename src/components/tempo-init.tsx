"use client";

import { TempoDevtools } from "tempo-devtools";
import { useEffect } from "react";
import { registerNavigationEvents } from "@/app/navigation-events";

export function TempoInit() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_TEMPO) {
      TempoDevtools.init();
    }

    // Register navigation event listeners
    registerNavigationEvents();
  }, []);

  return null;
}

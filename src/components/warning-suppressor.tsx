'use client';

import { useEffect } from 'react';

export default function WarningSuppressor() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalWarn = console.warn;
      console.warn = (...args) => {
        // Suppress the specific ref warning
        if (
          typeof args[0] === 'string' && 
          (args[0].includes('Function components cannot be given refs') ||
           args[0].includes('forwardRef'))
        ) {
          return;
        }
        // Allow all other warnings through
        originalWarn.apply(console, args);
      };

      // Cleanup function to restore original console.warn
      return () => {
        console.warn = originalWarn;
      };
    }
  }, []);

  return null; // This component doesn't render anything
} 
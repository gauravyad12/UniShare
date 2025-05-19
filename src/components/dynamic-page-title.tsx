"use client";

import { useEffect } from "react";

interface DynamicPageTitleProps {
  title: string;
}

export default function DynamicPageTitle({ title }: DynamicPageTitleProps) {
  useEffect(() => {
    // Save the original title to restore it when the component unmounts
    const originalTitle = document.title;
    
    // Set the new title
    document.title = title;
    
    // Restore the original title when the component unmounts
    return () => {
      document.title = originalTitle;
    };
  }, [title]);

  // This component doesn't render anything
  return null;
}

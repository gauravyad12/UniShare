"use client";

import { useMobileDetection } from "@/hooks/use-mobile-detection";
import Navbar from "./navbar";

export default function MobileAwareNavbar() {
  const isMobile = useMobileDetection();
  
  // Don't render the navbar on mobile
  if (isMobile) {
    return null;
  }
  
  // Render the navbar on desktop
  return <Navbar />;
}

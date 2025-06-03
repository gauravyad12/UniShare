"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/loading-spinner";

interface AdminAccessGuardProps {
  children: React.ReactNode;
}

export default function AdminAccessGuard({ children }: AdminAccessGuardProps) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<"mobile" | "appilix" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = () => {
      if (typeof window === 'undefined') return;

      // Check user agent for Appilix
      const userAgent = navigator.userAgent;
      if (userAgent.includes("Appilix")) {
        setIsBlocked(true);
        setBlockReason("appilix");
        setIsLoading(false);
        return;
      }

      // Check for mobile view
      const width = window.innerWidth;
      const hasTouchCapability = 'ontouchstart' in window ||
                                navigator.maxTouchPoints > 0 ||
                                (navigator as any).msMaxTouchPoints > 0;

      // Consider mobile if width is small OR device has touch capability
      const isMobileView = width < 768 || hasTouchCapability;
      
      if (isMobileView) {
        setIsBlocked(true);
        setBlockReason("mobile");
        setIsLoading(false);
        return;
      }

      // Access allowed
      setIsBlocked(false);
      setBlockReason(null);
      setIsLoading(false);
    };

    // Initial check
    checkAccess();

    // Add event listener for window resize to handle dynamic mobile detection
    const handleResize = () => {
      checkAccess();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleGoBack = () => {
    router.push("/dashboard");
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isBlocked) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            {blockReason === "mobile" ? (
              <>
                <Smartphone className="h-4 w-4" />
                Mobile Access Restricted
              </>
            ) : (
              <>
                <Monitor className="h-4 w-4" />
                Access Restricted
              </>
            )}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {blockReason === "mobile" ? (
              <>
                Admin pages are not accessible on mobile devices for security and usability reasons. 
                Please access this page from a desktop or laptop computer.
              </>
            ) : (
              <>
                This page cannot be accessed from your current browser or application. 
                Please use a standard web browser to access admin features.
              </>
            )}
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-2">
          <Button onClick={handleGoBack} variant="outline">
            Return to Dashboard
          </Button>
          {blockReason === "mobile" && (
            <Button 
              onClick={() => window.location.reload()} 
              variant="secondary"
              className="hidden sm:inline-flex"
            >
              Retry Access
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 
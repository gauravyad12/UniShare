"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

interface ClientSubscriptionWrapperProps {
  children: ReactNode;
  hasSubscription: boolean;
  redirectTo?: string;
}

export function ClientSubscriptionWrapper({
  children,
  hasSubscription,
  redirectTo = "/pricing",
}: ClientSubscriptionWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (!hasSubscription) {
      // Check if this is the textbook-answers page
      if (pathname === "/dashboard/tools/textbook-answers" ||
          pathname.startsWith("/dashboard/tools/textbook-answers/")) {
        // Redirect to the tools page
        router.push("/dashboard/tools");
      } else if (pathname === "/dashboard/tools/proxy-browser" ||
                 pathname.startsWith("/dashboard/tools/proxy-browser/")) {
        // Redirect to the tools page
        router.push("/dashboard/tools");
      } else {
        // For other pages, show the upgrade prompt
        setShowUpgradePrompt(true);
      }
    }
  }, [hasSubscription, redirectTo, router, pathname]);

  if (showUpgradePrompt) {
    return (
      <div className="space-y-4">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Scholar+ Feature</h3>
              <p className="text-sm text-muted-foreground mb-3">
                This feature requires a Scholar+ subscription. Upgrade to access all Scholar+ features.
              </p>
              <Button asChild size="sm">
                <Link href={redirectTo}>Upgrade Now</Link>
              </Button>
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}

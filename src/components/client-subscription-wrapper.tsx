"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const [isClient, setIsClient] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // For now, we'll show an upgrade prompt instead of redirecting
    // This allows users to still access the dashboard while encouraging upgrades
    if (!hasSubscription) {
      setShowUpgradePrompt(true);

      // In the future, when we want to enforce subscription checks, uncomment:
      // router.push(redirectTo);
    }
  }, [hasSubscription, redirectTo, router]);

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

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "./ui/button";
import Link from "next/link";
import { Lock } from "lucide-react";

export function SubscriptionRequiredNotice() {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkSubscription() {
      try {
        const supabase = createClient();

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();

        // Default to false - require subscription for Scholar+ features
        let userHasSubscription = false;

        if (!user) {
          // If user is not logged in, they don't have a subscription
          setIsLoading(false);
          setHasSubscription(false);
          return;
        }

        try {
          // Check regular subscription first
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("status, current_period_end")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();

          const currentTime = Math.floor(Date.now() / 1000);

          if (subscription) {
            if (subscription.status === "active" &&
                (!subscription.current_period_end ||
                 subscription.current_period_end > currentTime)) {
              userHasSubscription = true;
            }
            else if (subscription.status === "active" &&
                     subscription.current_period_end &&
                     subscription.current_period_end <= currentTime) {
              console.warn("Subscription is marked as active but has expired");
            }
          }

          // Check temporary access if no regular subscription
          if (!userHasSubscription) {
            const { data: temporaryAccess } = await supabase
              .from("temporary_scholar_access")
              .select("expires_at")
              .eq("user_id", user.id)
              .eq("is_active", true)
              .gt("expires_at", new Date().toISOString())
              .limit(1)
              .maybeSingle();

            if (temporaryAccess) {
              userHasSubscription = true;
            }
          }
        } catch (error) {
          console.error("Error checking subscription:", error);
        }

        setHasSubscription(userHasSubscription);
      } catch (error) {
        console.error("Error in subscription check:", error);
        // Default to showing the notice on error
        setHasSubscription(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkSubscription();
  }, []);

  // Show nothing while loading to avoid flicker
  if (isLoading) {
    return null;
  }

  // Only show the notice if the user doesn't have a subscription
  if (hasSubscription) {
    return null;
  }

  // Show the subscription required notice
  return (
    <div className="mt-12 bg-primary/5 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <Lock className="h-5 w-5 md:h-6 md:w-6 text-primary mt-1" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Scholar+ Subscription Required</h3>
          <p className="text-muted-foreground mb-4">
            These premium tools are available exclusively to Scholar+ subscribers. Upgrade your account to unlock all Scholar+ features and enhance your academic experience.
          </p>
          <Button asChild>
            <Link href="/pricing">View Pricing Plans</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ClientSubscriptionWrapper } from "./client-subscription-wrapper";

interface ClientSubscriptionCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ClientSubscriptionCheck({
  children,
  redirectTo = "/pricing",
}: ClientSubscriptionCheckProps) {
  const [hasSubscription, setHasSubscription] = useState(true);
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
          // If user is not logged in, redirect to login page
          setIsLoading(false);
          setHasSubscription(false);
          return;
        }

        try {
          // Check if user has an active subscription
          const { data: subscriptions } = await supabase
            .from("subscriptions")
            .select("status, current_period_end")
            .eq("user_id", user.id)
            .order('created_at', { ascending: false });

          // Get the current time
          const currentTime = Math.floor(Date.now() / 1000);

          // Check if any subscription is active and valid
          if (subscriptions && subscriptions.length > 0) {
            // First check the most recent subscription (ordered by created_at desc)
            const latestSubscription = subscriptions[0];

            // Check if the latest subscription is active and not expired
            if (latestSubscription.status === "active" &&
                (!latestSubscription.current_period_end ||
                 latestSubscription.current_period_end > currentTime)) {
              userHasSubscription = true;
            }
            // If the latest subscription is not active or is expired, log it
            else if (latestSubscription.status === "active" &&
                     latestSubscription.current_period_end &&
                     latestSubscription.current_period_end <= currentTime) {
              console.warn("Latest subscription is marked as active but has expired");
            }

            // Log the number of subscription records found
            if (subscriptions.length > 1) {
              console.info(`User has ${subscriptions.length} subscription records. Using the most recent one.`);
            }
          }
        } catch (error) {
          console.error("Error checking subscription:", error);
        }

        setHasSubscription(userHasSubscription);
      } catch (error) {
        console.error("Error in subscription check:", error);
        // Default to false on error to ensure proper access control
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

  return (
    <ClientSubscriptionWrapper
      hasSubscription={hasSubscription}
      redirectTo={redirectTo}
    >
      {children}
    </ClientSubscriptionWrapper>
  );
}

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
          // Use the enhanced subscription check that includes temporary access
          const { data: hasAccess } = await supabase
            .rpc('has_scholar_plus_access', { p_user_id: user.id });

          userHasSubscription = hasAccess || false;
        } catch (error) {
          console.error("Error checking subscription:", error);
          
          // Fallback to manual check if stored procedure fails
          try {
            // Check regular subscription
            const { data: subscriptions } = await supabase
              .from("subscriptions")
              .select("status, current_period_end")
              .eq("user_id", user.id)
              .order('created_at', { ascending: false });

            const currentTime = Math.floor(Date.now() / 1000);

            if (subscriptions && subscriptions.length > 0) {
              const latestSubscription = subscriptions[0];
              if (latestSubscription.status === "active" &&
                  (!latestSubscription.current_period_end ||
                   latestSubscription.current_period_end > currentTime)) {
                userHasSubscription = true;
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
          } catch (fallbackError) {
            console.error("Error in fallback subscription check:", fallbackError);
          }
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

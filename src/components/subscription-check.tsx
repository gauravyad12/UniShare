import { createClient } from "@/utils/supabase/server";
import { ClientSubscriptionWrapper } from "./client-subscription-wrapper";

interface SubscriptionCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export async function SubscriptionCheck({
  children,
  redirectTo = "/pricing",
}: SubscriptionCheckProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Default to false - require subscription for Scholar+ features
  let hasSubscription = false;

  if (!user) {
    // If user is not logged in, they don't have a subscription
    return (
      <ClientSubscriptionWrapper
        hasSubscription={false}
        redirectTo={redirectTo}
      >
        {children}
      </ClientSubscriptionWrapper>
    );
  }

  try {
    // Check if user has an active subscription
    const { data: subscriptionData } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    // If we have subscription data and it's active, check if it's still valid
    if (subscriptionData) {
      // Check if the subscription is still valid
      const currentTime = Math.floor(Date.now() / 1000);
      const isValid = subscriptionData.status === "active" &&
                      (!subscriptionData.current_period_end ||
                       subscriptionData.current_period_end > currentTime);

      hasSubscription = isValid;

      // If subscription is expired but still marked as active, log a warning
      if (subscriptionData.status === "active" &&
          subscriptionData.current_period_end &&
          subscriptionData.current_period_end <= currentTime) {
        console.warn("Subscription is marked as active but has expired");
      }
    }
  } catch (error) {
    console.error("Error checking subscription:", error);
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

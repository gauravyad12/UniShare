import { createClient } from "@/utils/supabase/server";
import { ClientSubscriptionWrapper } from "./client-subscription-wrapper";
import { checkScholarPlusAccessStoredProc } from "@/utils/supabase/subscription-check";

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
    // Use the enhanced subscription check that includes temporary access
    hasSubscription = await checkScholarPlusAccessStoredProc(user.id);
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

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
  // For now, we're just passing the children through without checking
  // This ensures the dashboard is accessible as mentioned
  const hasSubscription = true;

  return (
    <ClientSubscriptionWrapper
      hasSubscription={hasSubscription}
      redirectTo={redirectTo}
    >
      {children}
    </ClientSubscriptionWrapper>
  );
}

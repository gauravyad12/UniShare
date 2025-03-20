"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    setIsClient(true);

    // If we're on the client and the user doesn't have a subscription,
    // we could redirect here, but for now we'll just show the content
    // since you mentioned you want the dashboard to be accessible

    // Uncomment this if you want to enforce subscription checks
    // if (!hasSubscription) {
    //   router.push(redirectTo);
    // }
  }, [hasSubscription, redirectTo, router]);

  return <>{children}</>;
}

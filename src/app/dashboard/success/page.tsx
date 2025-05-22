"use client";

export const dynamic = "force-dynamic";


import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

// Component that safely reads search params
function SearchParamsReader({ onParamsChange }: { onParamsChange: (params: URLSearchParams) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams) {
      onParamsChange(searchParams);
    }
  }, [searchParams, onParamsChange]);

  return null;
}

export default function SuccessPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle search params changes
  const handleParamsChange = (params: URLSearchParams) => {
    const sid = params.get("session_id");
    setSessionId(sid);
  };

  useEffect(() => {
    if (!sessionId) return;

    const verifySession = async () => {
      try {
        setLoading(true);

        // Wait a moment to allow the webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        const supabase = createClient();

        // Check if the user has an active subscription
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError("User not found. Please sign in.");
          setLoading(false);
          return;
        }

        // Get the session to include the access token if needed for other API calls
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        if (!accessToken) {
          console.warn("No access token available, but continuing anyway");
        }

        const { data: subscription, error: subscriptionError } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (subscriptionError) {
          console.error("Error checking subscription:", subscriptionError);
          setError("Error verifying your subscription. Please contact support.");
          setLoading(false);
          return;
        }

        if (!subscription) {
          // If no active subscription is found, wait a bit longer and try again
          await new Promise(resolve => setTimeout(resolve, 3000));

          const supabase = createClient();
          const { data: retrySubscription, error: retryError } = await supabase
            .from("subscriptions")
            .select("status")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();

          if (retryError || !retrySubscription) {
            setError("Your subscription is being processed. Please check back in a few minutes.");
            setLoading(false);
            return;
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error verifying session:", error);
        setError("An error occurred while verifying your subscription.");
        setLoading(false);
      }
    };

    verifySession();
  }, [sessionId]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Safely read search params with Suspense */}
      <Suspense fallback={null}>
        <SearchParamsReader onParamsChange={handleParamsChange} />
      </Suspense>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4">Subscription Successful!</h1>

          {loading ? (
            <p className="text-muted-foreground mb-8">Verifying your subscription...</p>
          ) : error ? (
            <p className="text-red-500 mb-8">{error}</p>
          ) : (
            <p className="text-muted-foreground mb-8">
              Thank you for subscribing to Scholar+! Your account has been upgraded and you now have access to all premium features.
            </p>
          )}

          <div className="flex flex-col gap-4">
            <Button asChild size="lg">
              <Link href="/dashboard/tools">
                Explore Scholar+ Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/dashboard">
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

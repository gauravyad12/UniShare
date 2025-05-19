"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, ChevronRight, Lock } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { createClient } from "@/utils/supabase/client";

export default function MobileScholarPlusSection() {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check subscription status
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

  // Featured Scholar+ tools for mobile view
  const featuredTools = [
    {
      id: "ai-essay-writer",
      name: "AI Essay Writer",
      comingSoon: true,
      path: "/dashboard/scholar-plus/ai-essay-writer",
    },
    {
      id: "textbook-answers",
      name: "Textbook Answers",
      comingSoon: false,
      path: "/dashboard/scholar-plus/textbook-answers",
    },
    {
      id: "ai-document-chat",
      name: "AI Document Chat",
      comingSoon: true,
      path: "/dashboard/scholar-plus/ai-document-chat",
    },
  ];

  return (
    <section className="dashboard-mobile-section mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Scholar+</h2>
        </div>
        <Link href="/dashboard/scholar-plus" className="text-xs text-primary flex items-center">
          View All <ChevronRight className="h-3 w-3 ml-1" />
        </Link>
      </div>

      <div className="space-y-3">
        {featuredTools.map((tool) => (
          <Card key={tool.id} className="p-3 flex items-center justify-between bg-background/70 backdrop-blur-md shadow-sm border border-primary/10">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-md">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm">{tool.name}</span>
                  {tool.comingSoon && (
                    <Badge variant="outline" className="text-[10px] py-0 h-4 bg-primary/5 text-primary">
                      Soon
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button size="sm" variant="ghost" asChild disabled={tool.comingSoon} className="ml-auto">
              <Link href={tool.path}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        ))}

        {/* Only show upgrade section if user doesn't have a subscription */}
        {!isLoading && !hasSubscription && (
          <div className="bg-primary/5 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Scholar+ Features</span>
            </div>
            <Button size="sm" variant="outline" asChild className="h-8">
              <Link href="/pricing">Upgrade</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

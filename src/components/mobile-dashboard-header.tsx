"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { InfoIcon, Sparkles, BookOpen, MessageSquare, UserPlus, Users, Search, Coins, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import MobileNotifications from "./mobile-notifications";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import SearchBarWithClear from "./search-bar-with-clear";
import { createClient } from "@/utils/supabase/client";
import { formatLargeNumber } from "@/utils/format-utils";

interface MobileDashboardHeaderProps {
  userName: string;
  universityName: string;
  universityLogoUrl?: string | null;
  avatarUrl?: string | null;
  resourceCount: number;
  studyGroupCount: number;
  username?: string;
}

interface IQPointsData {
  iq_points: number;
  subscription_status: 'none' | 'regular' | 'temporary';
  temporary_access?: {
    expires_at: string;
    points_spent: number;
    access_duration_hours: number;
    remaining_hours: number;
  };
}

function MobileDashboardHeaderComponent({
  userName,
  universityName,
  universityLogoUrl,
  avatarUrl,
  resourceCount,
  studyGroupCount,
  username,
}: MobileDashboardHeaderProps) {
  const [greeting, setGreeting] = React.useState("Good day");
  const [hasScholarPlus, setHasScholarPlus] = React.useState(false);
  const [iqPointsData, setIQPointsData] = React.useState<IQPointsData | null>(null);
  const [iqPointsLoading, setIQPointsLoading] = React.useState(true);
  const supabase = createClient();

  React.useEffect(() => {
    // Set appropriate greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Fetch IQ points data
  React.useEffect(() => {
    async function fetchIQPoints() {
      try {
        const response = await fetch('/api/iq-points/status');
        const result = await response.json();
        if (result.success) {
          setIQPointsData(result);
        }
      } catch (error) {
        console.error('Error fetching IQ points data:', error);
      } finally {
        setIQPointsLoading(false);
      }
    }

    fetchIQPoints();
  }, []);

  // Check if user has Scholar+ subscription
  React.useEffect(() => {
    async function checkSubscription() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Use the enhanced stored procedure that checks both regular and temporary access
        const { data: hasAccess } = await supabase
          .rpc('has_scholar_plus_access', { p_user_id: user.id });

        if (hasAccess) {
          setHasScholarPlus(true);
        } else {
          // Fallback to manual checks
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("status, current_period_end")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();

          let hasScholarPlus = false;

          if (subscription) {
            const currentTime = Math.floor(Date.now() / 1000);
            hasScholarPlus = subscription.status === "active" &&
                          (!subscription.current_period_end ||
                           subscription.current_period_end > currentTime);
          }

          // Check temporary access if no regular subscription
          if (!hasScholarPlus) {
            const { data: temporaryAccess } = await supabase
              .from("temporary_scholar_access")
              .select("expires_at")
              .eq("user_id", user.id)
              .eq("is_active", true)
              .gt("expires_at", new Date().toISOString())
              .limit(1)
              .maybeSingle();

            if (temporaryAccess) {
              hasScholarPlus = true;
            }
          }

          setHasScholarPlus(hasScholarPlus);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    }

    checkSubscription();
  }, [supabase]);

  // Get first name only
  const firstName = userName.split(" ")[0];

  return (
    <div className="relative overflow-hidden pb-4">
      {/* No local gradients - using page-level gradients instead */}

      {/* No decorative elements - using page-level background */}

      {/* Header content */}
      <div className="pt-6 pb-8 px-4">
        {/* Top row with avatar and notifications */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Link href={username ? `/u/${username}` : "/dashboard/profile/edit"} className="relative group">
              <Avatar className="h-[47px] w-12 border-2 border-primary/10 rounded-full overflow-hidden group-hover:border-primary transition-colors">
                <AvatarImage src={avatarUrl || undefined} alt={userName} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-primary/10 rounded-full opacity-0 group-hover:opacity-20 transition-opacity" />
            </Link>
            <div>
              <p className="text-sm text-muted-foreground">{greeting}</p>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-xl">{firstName}</h2>
                {hasScholarPlus && (
                  <span className="text-amber-500" title="Scholar+ Member">
                    <Sparkles className="h-4 w-4" />
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Chat button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              asChild
            >
              <Link href="/dashboard/study-groups">
                <MessageSquare className="h-5 w-5" />
              </Link>
            </Button>

            {/* Notifications */}
            <MobileNotifications />
          </div>
        </div>

        {/* University info and IQ Points badges */}
        <div className="flex gap-2 items-center mb-5 justify-start">
          {/* University badge */}
          <div className="bg-background/70 backdrop-blur-md text-xs py-2 px-3 rounded-full text-muted-foreground flex gap-2 items-center shadow-sm border border-primary/5 w-fit">
            {universityLogoUrl ? (
              <img
                src={universityLogoUrl}
                alt={`${universityName} logo`}
                className="h-4 w-4 object-contain"
              />
            ) : (
              <div className="h-4 w-4 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-[10px] text-primary font-medium">
                  {universityName.substring(0, 1)}
                </span>
              </div>
            )}
            <span className="font-medium">
              {universityName}
            </span>
          </div>
          
          {/* IQ Points badge */}
          <Link href="/dashboard/shop" className="w-fit">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md text-xs py-2 px-3 rounded-full text-primary flex gap-2 items-center shadow-sm border border-primary/20 w-fit hover:from-blue-500/20 hover:to-purple-500/20 transition-all">
              <Coins className="h-4 w-4" />
              <span className="font-medium">
                {iqPointsLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                ) : (
                  iqPointsData?.iq_points.toLocaleString() || '0'
                )}
              </span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          </Link>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="bg-background/80 backdrop-blur-md rounded-full px-3 py-1 shadow-sm border border-primary/10 hover:border-primary/20 transition-all duration-300 search-bar-container w-full">
            <SearchBarWithClear
              placeholder="Search resources..."
              defaultValue=""
              baseUrl="/dashboard/resources"
              className="bg-transparent border-none shadow-none rounded-full transition-all duration-300"
            />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-background/70 backdrop-blur-md rounded-xl p-4 shadow-sm border border-primary/10 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Resources</span>
            </div>
            <p className="text-2xl font-bold">{formatLargeNumber(resourceCount)}</p>
          </div>

          <div className="bg-background/70 backdrop-blur-md rounded-xl p-4 shadow-sm border border-primary/10 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Study Groups</span>
            </div>
            <p className="text-2xl font-bold">{formatLargeNumber(studyGroupCount)}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex justify-between px-4 pb-2">
          <Button
            onClick={() => window.location.href = "/dashboard/resources"}
            variant="outline"
            className="flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-md rounded-xl p-4 shadow-sm border border-primary/10 hover:border-primary/20 transition-colors w-[30%] h-24"
          >
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xs text-center">Browse Resources</span>
          </Button>

          <Button
            onClick={() => window.location.href = "/dashboard/invite"}
            variant="outline"
            className="flex flex-col items-center justify-center gap-2 bg-primary/10 backdrop-blur-md rounded-xl p-4 shadow-sm border border-primary/20 hover:border-primary/30 transition-colors w-[30%] h-24"
          >
            <UserPlus className="h-6 w-6 text-primary" />
            <span className="text-xs text-center">Invite Friends</span>
          </Button>

          <Button
            onClick={() => window.location.href = "/dashboard/study-groups"}
            variant="outline"
            className="flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-md rounded-xl p-4 shadow-sm border border-primary/10 hover:border-primary/20 transition-colors w-[30%] h-24"
          >
            <Users className="h-6 w-6 text-primary" />
            <span className="text-xs text-center">Browse Groups</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Wrapper with error boundary
export default function MobileDashboardHeader(props: MobileDashboardHeaderProps) {
  try {
    return <MobileDashboardHeaderComponent {...props} />;
  } catch (error) {
    console.error('Error in MobileDashboardHeader:', error);
    // Fallback UI
    return (
      <div className="relative overflow-hidden pb-4">
        <div className="pt-6 pb-8 px-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-medium">
                  {props.userName.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Good day</p>
                <h2 className="font-bold text-xl">{props.userName.split(" ")[0]}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

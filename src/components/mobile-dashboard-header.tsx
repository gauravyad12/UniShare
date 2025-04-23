"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { InfoIcon, Sparkles, BookOpen, MessageSquare, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import MobileNotifications from "./mobile-notifications";
import { Button } from "./ui/button";

interface MobileDashboardHeaderProps {
  userName: string;
  universityName: string;
  avatarUrl?: string | null;
  resourceCount: number;
  studyGroupCount: number;
  username?: string;
}

export default function MobileDashboardHeader({
  userName,
  universityName,
  avatarUrl,
  resourceCount,
  studyGroupCount,
  username,
}: MobileDashboardHeaderProps) {
  const [greeting, setGreeting] = useState("Good day");
  useEffect(() => {
    // Set appropriate greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

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
              <h2 className="font-bold text-xl">{firstName}</h2>
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

        {/* University info */}
        <div className="bg-background/70 backdrop-blur-md text-sm p-3 px-4 rounded-lg text-muted-foreground flex gap-2 items-center mb-6 shadow-sm border border-primary/5">
          <InfoIcon size="14" className="text-primary" />
          <span>
            Welcome to {universityName}'s study hub
          </span>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-background/70 backdrop-blur-md rounded-xl p-4 shadow-sm border border-primary/10 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Resources</span>
            </div>
            <p className="text-2xl font-bold">{resourceCount}</p>
          </div>

          <div className="bg-background/70 backdrop-blur-md rounded-xl p-4 shadow-sm border border-primary/10 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Study Groups</span>
            </div>
            <p className="text-2xl font-bold">{studyGroupCount}</p>
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

"use client";

import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  UserCircle,
  Home,
  GraduationCap,
  BookOpen,
  Users,
  Settings,
  Bell,
  MessageSquare,
  LogOut,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Notifications from "./notifications";
import Messages from "./messages";

export default function DashboardNavbar() {
  const router = useRouter();
  const supabase = createClient();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("avatar_url, username")
          .eq("id", user.id)
          .single();

        if (profile) {
          setAvatarUrl(profile.avatar_url);
          setUsername(profile.username);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();

    // Set up a subscription to profile changes
    const channel = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_profiles",
        },
        (payload) => {
          if (payload.new) {
            setAvatarUrl(payload.new.avatar_url);
            setUsername(payload.new.username);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="w-full border-b border-border bg-background py-4 hidden md:block">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" prefetch className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">UniShare</span>
          </Link>

          <div className="flex items-center gap-4 ml-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/resources"
              className="text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Resources
            </Link>
            <Link
              href="/dashboard/study-groups"
              className="text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Users className="h-4 w-4" />
              Study Groups
            </Link>
            <Link
              href="/dashboard/invite"
              className="text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Invite
            </Link>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <Messages />
          <Notifications />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                {isLoading ? (
                  <UserCircle className="h-6 w-6 animate-pulse" />
                ) : avatarUrl ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={avatarUrl}
                      alt={username || "User"}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      <UserCircle className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <UserCircle className="h-6 w-6" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              {username && (
                <DropdownMenuItem asChild>
                  <Link href={`/u/${username}`}>Public Profile</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

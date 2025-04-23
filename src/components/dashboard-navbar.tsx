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
  const [fullName, setFullName] = useState<string | null>(null);
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
          .select("avatar_url, username, full_name")
          .eq("id", user.id)
          .single();

        if (profile) {
          setAvatarUrl(profile.avatar_url);
          setUsername(profile.username);
          setFullName(profile.full_name);
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
            setFullName(payload.new.full_name);
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
                  <UserCircle className="h-6 w-6" />
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
            <DropdownMenuContent align="end" className="w-56">
              {fullName && (
                <div className="flex flex-col space-y-1 p-2 border-b border-border">
                  <p className="font-medium">{fullName}</p>
                  {username && (
                    <p className="text-xs text-muted-foreground">@{username}</p>
                  )}
                </div>
              )}
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile/edit" className="flex items-center">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              {username && (
                <DropdownMenuItem asChild>
                  <Link href={`/u/${username}`} className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Public Profile
                  </Link>
                </DropdownMenuItem>
              )}
              <div className="px-2 py-1.5 border-t border-border mt-1"></div>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  UserCircle,
  Home,
  BookOpen,
  Users,
  Settings,
  LogOut,
  UserPlus,
  Bell,
  Mail,
  Database,
  ShieldAlert,
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Store the authenticated user ID to validate profile data
    let currentUserId: string | null = null;

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

        // Store the authenticated user ID for validation
        currentUserId = user.id;

        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("id, avatar_url, username, full_name, role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          setIsLoading(false);
          return;
        }

        // Security check: Verify the profile belongs to the authenticated user
        if (profile && profile.id === currentUserId) {
          setAvatarUrl(profile.avatar_url);
          setUsername(profile.username);
          setFullName(profile.full_name);
          setIsAdmin(profile.role === "admin");
        } else {
          console.error("Profile ID mismatch - security issue detected");
          // Clear any potentially incorrect data
          setAvatarUrl(null);
          setUsername(null);
          setFullName(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();

    // Set up a subscription to profile changes with security filtering
    const channel = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_profiles",
          filter: currentUserId ? `id=eq.${currentUserId}` : undefined, // Only listen to changes for the current user
        },
        (payload) => {
          // Additional security check: Only update if the payload belongs to the current user
          if (payload.new && payload.new.id === currentUserId) {
            setAvatarUrl(payload.new.avatar_url);
            setUsername(payload.new.username);
            setFullName(payload.new.full_name);
            setIsAdmin(payload.new.role === "admin");
          } else {
            console.warn("Received profile update for different user - ignoring");
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
            <Image
              src="/android-chrome-192x192.png"
              alt="UniShare Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
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

              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="flex items-center text-muted-foreground">
                    <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                    Admin
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin/push-notifications" className="flex items-center">
                      <Bell className="h-4 w-4 mr-2" />
                      Push Notifications
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin/email-templates" className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Templates
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin/migrations" className="flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      Database Migrations
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
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

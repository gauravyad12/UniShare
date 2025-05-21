"use client";

import { UserCircle, LogOut, Settings, Users, Bell, Mail, Database, ShieldAlert } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";

interface UserData {
  id: string;
  avatarUrl: string | null;
  username: string | null;
  fullName: string | null;
  email: string | null;
  role?: string | null;
  hasScholarPlus?: boolean;
}

interface DashboardNavbarClientProps {
  isLoading: boolean;
  userData: UserData | null;
  error?: string;
}

export function DashboardNavbarClient({ isLoading, userData, error }: DashboardNavbarClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isAdmin = userData?.role === "admin";

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full">
        <UserCircle className="h-6 w-6 animate-pulse" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          {userData?.avatarUrl ? (
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={userData.avatarUrl}
                alt={userData.username || "User"}
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
        {userData?.fullName && (
          <div className="flex flex-col space-y-1 p-2 border-b border-border">
            <p className="font-medium">{userData.fullName}</p>
            {userData.username && (
              <p className="text-xs text-muted-foreground">@{userData.username}</p>
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
        {userData?.username && (
          <DropdownMenuItem asChild>
            <Link href={`/u/${userData.username}`} className="flex items-center">
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
          {isSigningOut ? "Signing out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

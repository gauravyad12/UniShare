"use client";

import { UserCircle, LogOut, Settings } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
}

interface UserProfileClientProps {
  isLoading: boolean;
  userData: UserData | null;
  error?: string;
}

export function UserProfileClient({ isLoading, userData, error }: UserProfileClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  if (error || !userData) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full">
        <UserCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          {userData.avatarUrl ? (
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
      <DropdownMenuContent align="end" className="w-64">
        {/* User info section */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <p className="text-base font-medium">
            {userData.fullName || userData.username || "User"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {userData.email || "user@university.edu"}
          </p>
        </div>

        <DropdownMenuItem asChild className="py-2">
          <Link href="/dashboard/profile/edit" className="flex items-center">
            <span className="rounded-full bg-gray-100 dark:bg-gray-800 p-1 mr-2">
              <UserCircle className="h-4 w-4" />
            </span>
            Edit Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="py-2">
          <Link href="/dashboard/settings" className="flex items-center">
            <span className="rounded-full bg-gray-100 dark:bg-gray-800 p-1 mr-2">
              <Settings className="h-4 w-4" />
            </span>
            Settings
          </Link>
        </DropdownMenuItem>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-1"></div>

        <DropdownMenuItem onClick={handleSignOut} className="text-red-500 py-2">
          <span className="rounded-full bg-red-100 dark:bg-red-900/30 p-1 mr-2">
            <LogOut className="h-4 w-4" />
          </span>
          {isSigningOut ? "Signing out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

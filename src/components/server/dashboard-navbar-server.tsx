import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import Messages from "../messages";
import Notifications from "../notifications";
import { DashboardNavbarClient } from "./dashboard-navbar-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

/**
 * Server component that securely fetches user profile data for the navbar
 * This component handles the sensitive data fetching on the server side
 * and passes only the necessary data to the client component
 */
export async function DashboardNavbarServer() {
  const supabase = createClient();

  try {
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Return a placeholder component if no user is authenticated
      return <DashboardNavbarClient isLoading={false} userData={null} />;
    }

    // Fetch the user profile with a secure server-side query
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("id, avatar_url, username, full_name, role")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return <DashboardNavbarClient isLoading={false} userData={null} error="Failed to load profile" />;
    }

    // Check if user has Scholar+ subscription
    let hasScholarPlus = false;
    try {
      // Check regular subscription first
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

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
    } catch (subscriptionError) {
      console.error("Error checking subscription:", subscriptionError);
    }

    // Verify that the profile belongs to the authenticated user
    if (profile && profile.id === user.id) {
      // Only pass necessary data to the client component
      const userData = {
        id: profile.id,
        avatarUrl: profile.avatar_url,
        username: profile.username,
        fullName: profile.full_name,
        email: user.email,
        role: profile.role,
        hasScholarPlus,
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
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold">UniShare</span>
                  {hasScholarPlus && (
                    <span className="text-amber-500" title="Scholar+ Member">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles">
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                        <path d="M5 3v4" />
                        <path d="M19 17v4" />
                        <path d="M3 5h4" />
                        <path d="M17 19h4" />
                      </svg>
                    </span>
                  )}
                </div>
              </Link>

              <div className="flex items-center gap-4 ml-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-home">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/resources"
                  className="text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  Resources
                </Link>
                <Link
                  href="/dashboard/study-groups"
                  className="text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Study Groups
                </Link>

                {/* Items that will be hidden on smaller screens */}
                <div className="hidden lg:flex items-center gap-4">
                  <Link
                    href="/dashboard/tools"
                    className="text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-grid">
                      <rect width="7" height="7" x="3" y="3" rx="1" />
                      <rect width="7" height="7" x="14" y="3" rx="1" />
                      <rect width="7" height="7" x="14" y="14" rx="1" />
                      <rect width="7" height="7" x="3" y="14" rx="1" />
                    </svg>
                    Tools
                  </Link>
                  <Link
                    href="/dashboard/invite"
                    className="text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-plus">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" x2="19" y1="8" y2="14" />
                      <line x1="22" x2="16" y1="11" y2="11" />
                    </svg>
                    Invite
                  </Link>
                </div>

                {/* More dropdown for smaller screens */}
                <div className="lg:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="19" cy="12" r="1" />
                          <circle cx="5" cy="12" r="1" />
                        </svg>
                        <span className="sr-only">More</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/tools" className="flex items-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <rect width="7" height="7" x="3" y="3" rx="1" />
                            <rect width="7" height="7" x="14" y="3" rx="1" />
                            <rect width="7" height="7" x="14" y="14" rx="1" />
                            <rect width="7" height="7" x="3" y="14" rx="1" />
                          </svg>
                          Tools
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/invite" className="flex items-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <line x1="19" x2="19" y1="8" y2="14" />
                            <line x1="22" x2="16" y1="11" y2="11" />
                          </svg>
                          Invite
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <Messages />
              <Notifications />
              <DashboardNavbarClient isLoading={false} userData={userData} />
            </div>
          </div>
        </nav>
      );
    } else {
      console.error("Profile ID mismatch - security issue detected");
      return <DashboardNavbarClient isLoading={false} userData={null} error="Security validation failed" />;
    }
  } catch (error) {
    console.error("Error in DashboardNavbarServer:", error);
    return <DashboardNavbarClient isLoading={false} userData={null} error="An error occurred" />;
  }
}

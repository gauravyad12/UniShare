"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { GraduationCap, BookOpen, Users, Search } from "lucide-react";
import UserProfile from "./user-profile";
import { ThemeToggle } from "./theme-toggle";
import { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";

export default function ClientNavbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUser(data.user);
      }
      setLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleNavigation = () => {
    if (typeof document !== "undefined") {
      document.dispatchEvent(new Event("navigationStart"));
      // We'll manually dispatch navigationComplete in the NavigationEvents component
    }
  };

  return (
    <nav className="w-full border-b border-border bg-background py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link
          href="/"
          prefetch
          className="flex items-center gap-2"
          onClick={handleNavigation}
        >
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">UniShare</span>
        </Link>

        <div className="hidden lg:flex gap-6 items-center">
          <Link
            href="/#platform-features"
            className="text-foreground/80 hover:text-primary font-medium"
            onClick={handleNavigation}
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-foreground/80 hover:text-primary font-medium"
            onClick={handleNavigation}
          >
            How It Works
          </Link>
          <Link
            href="/universities"
            className="text-foreground/80 hover:text-primary font-medium"
            onClick={handleNavigation}
          >
            Universities
          </Link>
          <Link
            href="/pricing"
            className="text-foreground/80 hover:text-primary font-medium"
            onClick={handleNavigation}
          >
            Pricing
          </Link>
        </div>

        <div className="flex gap-4 items-center">
          <ThemeToggle />
          {!loading && user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden md:block px-4 py-2 text-sm font-medium"
                onClick={handleNavigation}
              >
                <Button>Dashboard</Button>
              </Link>
              <UserProfile />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary"
                onClick={handleNavigation}
              >
                Sign In
              </Link>
              <Link
                href="/verify-invite"
                className="hidden md:block px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
                onClick={handleNavigation}
              >
                Join Now
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

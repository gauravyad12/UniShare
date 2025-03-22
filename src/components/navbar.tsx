"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { GraduationCap } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useEffect, useState } from "react";
import { createClientOnlyClient } from "@/utils/supabase/client-only";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);

  // Check if environment variables are available
  const hasSupabaseConfig =
    typeof window !== "undefined" &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Only create the client if the environment variables are available
  const supabase = hasSupabaseConfig ? createClientOnlyClient() : null;

  useEffect(() => {
    if (!supabase) {
      setClientError(
        "Supabase client could not be initialized. Check environment variables.",
      );
      setLoading(false);
      return;
    }

    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
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
  }, [supabase]);

  return (
    <nav className="w-full border-b border-border bg-background py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" prefetch className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">UniShare</span>
        </Link>

        <div className="hidden md:flex gap-6 items-center">
          <Link
            href="/#platform-features"
            className="text-foreground/80 hover:text-primary font-medium"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-foreground/80 hover:text-primary font-medium"
          >
            How It Works
          </Link>
          <Link
            href="/universities"
            className="text-foreground/80 hover:text-primary font-medium"
          >
            Universities
          </Link>
        </div>

        <div className="flex gap-4 items-center">
          <ThemeToggle />
          {!loading && user ? (
            <>
              <Link href="/dashboard" className="px-4 py-2 text-sm font-medium">
                <Button>Dashboard</Button>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary"
              >
                Sign In
              </Link>
              <Link
                href="/verify-invite"
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
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

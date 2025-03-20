"use client";

import { ReactNode, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import Link from "next/link";

interface DashboardClientWrapperProps {
  children: ReactNode;
  initialAuthState?: boolean;
}

export function DashboardClientWrapper({
  children,
  initialAuthState = false,
}: DashboardClientWrapperProps) {
  const [isLoading, setIsLoading] = useState(!initialAuthState);
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthState);
  const router = useRouter();

  useEffect(() => {
    if (initialAuthState) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();

        if (data.session) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push("/sign-in?error=Please sign in to access the dashboard");
        }
      } catch (error) {
        setIsAuthenticated(false);
        router.push(
          "/sign-in?error=Authentication error. Please sign in again.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Set up auth state change listener
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsAuthenticated(true);
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        router.push("/sign-in");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, initialAuthState]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col gap-8 items-center justify-center min-h-[60vh]">
        <h1 className="text-3xl font-bold">Please sign in</h1>
        <p className="text-muted-foreground">
          You need to be signed in to view this page
        </p>
        <Button asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

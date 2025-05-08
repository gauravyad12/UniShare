"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function VerificationSuccessClient() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if the user is authenticated
    const checkAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    // Start countdown for auto-redirect
    if (isAuthenticated !== null) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Redirect to dashboard if authenticated, otherwise to sign-in
            router.push(isAuthenticated ? "/dashboard" : "/sign-in");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isAuthenticated, router]);

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Email Verified Successfully!</CardTitle>
          <CardDescription>
            Your email has been successfully verified.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            Thank you for verifying your email address. You can now access all features of UniShare.
          </p>
          <p className="text-sm text-muted-foreground">
            You will be automatically redirected to the {isAuthenticated ? "dashboard" : "sign-in page"} in {countdown} seconds.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href={isAuthenticated ? "/dashboard" : "/sign-in"}>
              Continue to {isAuthenticated ? "Dashboard" : "Sign In"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

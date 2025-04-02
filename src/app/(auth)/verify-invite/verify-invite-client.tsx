"use client";

import { redirect } from "next/navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "../../../../supabase/client";

export default function VerifyInviteClient() {
  const [inviteCode, setInviteCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get("error");
  const successMessage = searchParams.get("success");
  const clearCookie = searchParams.get("clear_cookie");
  const codeParam = searchParams.get("code");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [autoVerified, setAutoVerified] = useState(false);

  // Focus the first input on component mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Clear cookie if requested via query param
  useEffect(() => {
    if (clearCookie === "true") {
      // Clear the cookie client-side
      document.cookie = "verified_invite_code=; path=/; max-age=0";
    }
  }, [clearCookie]);

  // Auto-fill and verify code from URL parameter
  useEffect(() => {
    if (codeParam && !autoVerified) {
      // Only process if we have a code and haven't auto-verified yet
      const codeArray = codeParam.split("").slice(0, 6);

      // Pad with empty strings if code is shorter than 6 characters
      const paddedCode = [
        ...codeArray,
        ...Array(6 - codeArray.length).fill(""),
      ];

      setInviteCode(paddedCode);

      // Auto-verify the code after a short delay to allow state to update
      setTimeout(() => {
        handleVerifyInvite(null, codeParam);
        setAutoVerified(true);
      }, 300);
    }
  }, [codeParam]);

  // Check if we already have a verified invite code in cookies
  useEffect(() => {
    const checkExistingCode = () => {
      // Check for cookie
      const cookies = document.cookie.split("; ");
      const inviteCodeCookie = cookies.find((cookie) =>
        cookie.startsWith("verified_invite_code="),
      );

      // Only redirect if we have a verified code AND we're not in a redirect loop
      // We'll use session storage to track if we've already tried to redirect
      if (inviteCodeCookie && !sessionStorage.getItem("preventRedirectLoop")) {
        // Set a flag to prevent redirect loops
        sessionStorage.setItem("preventRedirectLoop", "true");
        // We have a verified code, redirect to sign-up
        router.push("/sign-up");
      }
    };

    checkExistingCode();

    // Clear the prevention flag when component unmounts
    return () => {
      sessionStorage.removeItem("preventRedirectLoop");
    };
  }, [router]);

  const handleVerifyInvite = async (
    e: React.FormEvent | null,
    manualCode?: string,
  ) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    const code = manualCode || inviteCode.join("").trim();
    if (!code) {
      setError("Invite code is required");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Call the edge function to verify the invite code
      console.log("Verifying invite code:", code);

      try {
        // Add a small delay before invoking the function to prevent race condition
        await new Promise((resolve) => setTimeout(resolve, 100));

        const { data, error } = await supabase.functions.invoke(
          "supabase-functions-verify-invite-code",
          {
            body: { inviteCode: code },
          },
        );

        console.log("Edge function response:", { data, error });

        if (error) {
          console.error("Edge function error:", error);
          setError(error.message || "Failed to verify invite code");
          setIsLoading(false);
          return;
        }

        if (!data?.valid) {
          setError(data?.error || "Invalid invite code");
          setIsLoading(false);
          return;
        }

        // Store the verified invite code in a cookie (client-side)
        document.cookie = `verified_invite_code=${code}; path=/; max-age=3600`;

        // Store in session storage as backup
        sessionStorage.setItem("verifiedInviteCode", code);

        // Set a flag to prevent redirect loops
        sessionStorage.setItem("preventRedirectLoop", "true");

        // Redirect to sign-up page
        router.push("/sign-up");
        return;
      } catch (invokeError) {
        console.error("Failed to invoke edge function:", invokeError);
        setError(
          "Failed to connect to verification service. Please try again later.",
        );
        setIsLoading(false);
        return;
      }

      // This section is now handled inside the try block
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-background/95">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Join UniShare</CardTitle>
          <CardDescription>
            Enter your invite code to access the sign-up page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <FormMessage message={{ success: successMessage }} />
          )}
          {/* Error message moved below the invite code input */}

          <form onSubmit={handleVerifyInvite} className="space-y-4">
            <div className="space-y-2">
              <p className="text-center text-lg font-medium mb-4">
                Enter Invite Code
              </p>
              <div className="flex justify-center gap-2">
                {inviteCode.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const newCode = [...inviteCode];
                      newCode[index] = e.target.value;
                      setInviteCode(newCode);

                      // Auto-focus next input
                      if (e.target.value && index < inviteCode.length - 1) {
                        inputRefs.current[index + 1]?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      // Handle backspace to go to previous input
                      if (e.key === "Backspace" && !digit && index > 0) {
                        inputRefs.current[index - 1]?.focus();
                      }
                    }}
                    className="w-12 h-12 text-center text-xl"
                    style={{ borderColor: digit ? "#22c55e" : undefined }}
                    autoComplete="off"
                  />
                ))}
              </div>
              {error && (
                <div className="mt-2 text-center text-red-500 text-sm">
                  {error}
                </div>
              )}
            </div>
            <div className="flex justify-center mt-6">
              <SubmitButton
                pendingText="Verifying..."
                disabled={isLoading}
                className="w-40 bg-primary hover:bg-primary/90"
              >
                Verify Code
              </SubmitButton>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

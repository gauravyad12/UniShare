"use client";

import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { SearchParamsProvider } from "@/components/search-params-wrapper";
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
  const [params, setParams] = useState<URLSearchParams | null>(null);
  const errorMessage = params?.get("error");
  const successMessage = params?.get("success");
  const clearCookie = params?.get("clear_cookie");
  const codeParam = params?.get("code");

  const handleParamsChange = useCallback((newParams: URLSearchParams) => {
    setParams(newParams);
  }, []);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [autoVerified, setAutoVerified] = useState(false);

  // Focus the first input on component mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Clear cookie if requested via query param
  useEffect(() => {
    if (clearCookie === "true") {
      // Clear the cookie using the API
      const clearCookieViaApi = async () => {
        try {
          await fetch("/api/invite/verify", {
            method: "DELETE",
          });
          console.log("Cleared invite code cookie via API");
        } catch (error) {
          console.error("Error clearing cookie via API:", error);
          // Fallback to client-side cookie clearing
          document.cookie = "verified_invite_code=; path=/; max-age=0";
          console.log("Cleared invite code cookie client-side as fallback");
        }
      };

      clearCookieViaApi();
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
    if (!params) return;

    const checkExistingCode = () => {
      // Don't redirect if we have a no_redirect parameter
      const noRedirect = params.get("no_redirect");
      if (noRedirect === "true") {
        console.log("Skipping redirect due to no_redirect parameter");
        return;
      }

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
        console.log("Found valid invite code cookie, redirecting to sign-up");
        // We have a verified code, redirect to sign-up
        router.push("/sign-up");
      }
    };

    checkExistingCode();

    // Clear the prevention flag when component unmounts
    return () => {
      sessionStorage.removeItem("preventRedirectLoop");
    };
  }, [router, params]);

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
      console.log("Verifying invite code:", code);

      // Call the server-side API route to verify the invite code
      const response = await fetch("/api/invite/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteCode: code }),
      });

      const data = await response.json();
      console.log("API response:", data);

      if (!response.ok) {
        console.error("API error:", data);
        setError(data.error || "Failed to verify invite code");
        setIsLoading(false);
        return;
      }

      if (!data.valid) {
        setError(data.error || "Invalid invite code");
        setIsLoading(false);
        return;
      }

      // The cookie is set by the API response
      // Store in session storage as backup
      sessionStorage.setItem("verifiedInviteCode", code);

      // Set a flag to prevent redirect loops
      sessionStorage.setItem("preventRedirectLoop", "true");

      // Redirect to sign-up page
      router.push("/sign-up");
      return;
    } catch (err) {
      console.error("Error verifying invite code:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-start sm:justify-center p-4 pt-16 sm:pt-4 bg-gradient-to-b from-background to-background/95">
      <SearchParamsProvider onParamsChange={handleParamsChange} />
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
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/[^0-9]/g, '');

                      const newCode = [...inviteCode];
                      newCode[index] = value;
                      setInviteCode(newCode);

                      // Auto-focus next input
                      if (value && index < inviteCode.length - 1) {
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

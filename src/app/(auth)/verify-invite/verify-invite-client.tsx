"use client";

import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { SearchParamsProvider } from "@/components/search-params-wrapper";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/utils/supabase/client";
import AnimatedLogo from "@/components/animated-logo";
import GradientWaveBackground from "@/components/gradient-wave-background";
import MobileAwareNavbar from "@/components/mobile-aware-navbar";

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

  // Focus the hidden input on component mount for mobile devices
  useEffect(() => {
    // Check if it's likely a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Focus the hidden input for mobile devices
      hiddenInputRef.current?.focus();
    } else {
      // Focus the first visual input for desktop
      inputRefs.current[0]?.focus();
    }
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
      // Convert to uppercase for consistency
      const upperCaseCode = codeParam.toUpperCase();
      const codeArray = upperCaseCode.split("").slice(0, 6);

      // Pad with empty strings if code is shorter than 6 characters
      const paddedCode = [
        ...codeArray,
        ...Array(6 - codeArray.length).fill(""),
      ];

      setInviteCode(paddedCode);

      // Auto-verify the code after a short delay to allow state to update
      setTimeout(() => {
        handleVerifyInvite(null, upperCaseCode);
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

    // Get the code from either the manual code, hidden input, or the visual boxes
    let code = manualCode || hiddenInput || inviteCode.join("").trim();

    // Convert to uppercase if it's not already
    code = code.toUpperCase();

    if (!code) {
      setError("Invite code is required");
      setIsLoading(false);
      return;
    }

    // Validate that the code only contains letters and numbers
    if (!/^[A-Z0-9]+$/.test(code)) {
      setError("Invite code can only contain letters and numbers");
      setIsLoading(false);
      return;
    }

    // Validate code length
    if (code.length !== 6) {
      setError("Invite code must be 6 characters");
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

  // Add a new state for the hidden input field
  const [hiddenInput, setHiddenInput] = useState("");
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  // Add state to track if the input is focused
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Update the inviteCode array when the hidden input changes
  useEffect(() => {
    // Create a new array of 6 empty strings
    const newInviteCode = [...Array(6).fill("")];

    // If there's input, fill the array with the characters
    if (hiddenInput) {
      const codeArray = hiddenInput.toUpperCase().split("").slice(0, 6);

      codeArray.forEach((char, index) => {
        if (index < 6) {
          newInviteCode[index] = char;
        }
      });
    }

    // Always update the inviteCode, even when hiddenInput is empty
    setInviteCode(newInviteCode);
  }, [hiddenInput]);

  return (
    <>
      <MobileAwareNavbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
        <SearchParamsProvider onParamsChange={handleParamsChange} />
        <GradientWaveBackground />

        <div className="w-full max-w-md rounded-2xl border-0 bg-card/95 backdrop-blur-sm p-7 shadow-lg relative z-10 overflow-hidden">
          {/* Subtle gradient overlay for card */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-70 pointer-events-none"></div>

          <form onSubmit={handleVerifyInvite} className="flex flex-col space-y-7 relative">
            <div className="space-y-3 text-center">
              <AnimatedLogo />
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                Join UniShare
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your invite code to access the sign-up page
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="inviteCode" className="text-sm font-medium flex items-center justify-center">
                  Invite Code
                </Label>

                {/* Hidden input field for mobile browsers */}
                <input
                  ref={hiddenInputRef}
                  type="text"
                  inputMode="text"
                  pattern="[A-Za-z0-9]*"
                  maxLength={6}
                  value={hiddenInput}
                  onChange={(e) => {
                    // Allow empty string (for deletion) or only alphanumeric characters
                    const value = e.target.value === '' ? '' : e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                    setHiddenInput(value);
                  }}
                  onKeyDown={(e) => {
                    // Handle backspace and delete keys
                    if ((e.key === 'Backspace' || e.key === 'Delete') && hiddenInput.length === 0) {
                      // If the input is already empty, ensure the inviteCode is also empty
                      setInviteCode(["", "", "", "", "", ""]);
                    }
                  }}
                  onFocus={() => {
                    setIsInputFocused(true);
                  }}
                  onBlur={() => {
                    setIsInputFocused(false);
                    // Re-focus the input when it loses focus
                    // This helps on mobile when the keyboard might dismiss
                    setTimeout(() => {
                      hiddenInputRef.current?.focus();
                      setIsInputFocused(true);
                    }, 100);
                  }}
                  className="opacity-0 absolute top-0 left-0 h-1 w-1"
                  autoComplete="off"
                  aria-hidden="true"
                />

                {/* Visual code input boxes */}
                <div
                  className="flex justify-center gap-2 mb-2"
                  onClick={() => {
                    // Focus the hidden input and show keyboard
                    hiddenInputRef.current?.focus();

                    // On iOS, this can help ensure the keyboard appears
                    setTimeout(() => {
                      hiddenInputRef.current?.focus();
                    }, 100);
                  }}
                >
                  {inviteCode.map((digit, index) => {
                    // Find the index of the first empty box
                    const firstEmptyIndex = inviteCode.findIndex(d => d === "");
                    // If all boxes are filled, don't highlight any
                    // If all boxes are empty or firstEmptyIndex is 0, highlight the first one
                    const effectiveEmptyIndex = firstEmptyIndex === -1 ? -1 : firstEmptyIndex;
                    // Determine if this box should be highlighted (first empty box and input is focused)
                    // Special case: if all boxes are empty, highlight the first box
                    const allEmpty = inviteCode.every(d => d === "");
                    const shouldHighlight = isInputFocused && (
                      (index === effectiveEmptyIndex) ||
                      (allEmpty && index === 0)
                    );

                    return (
                      <div
                        key={index}
                        className={`w-12 h-12 flex items-center justify-center text-center text-xl rounded-xl border
                          ${digit ? "border-primary/50 bg-primary/5" :
                            shouldHighlight ? "border-primary ring-2 ring-primary/30 bg-primary/5" :
                            "border-muted bg-background/50"
                          }
                          transition-all duration-200 cursor-text shadow-sm`}
                      >
                        {digit}
                        {/* Add a blinking cursor to the first empty box when focused */}
                        {shouldHighlight && (
                          <div className="h-5 w-0.5 bg-primary animate-pulse ml-0.5"></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tap to enter message for mobile */}
                <p className="text-xs text-center text-muted-foreground">
                  Tap boxes to enter code
                </p>

                {error && (
                  <div className="mt-2 text-center text-red-500 text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <SubmitButton
              pendingText="Verifying..."
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-3 shadow-md hover:shadow-lg"
            >
              Verify Code
            </SubmitButton>

            {successMessage && (
              <FormMessage message={{ success: successMessage }} />
            )}

            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

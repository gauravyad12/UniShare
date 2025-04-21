import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import Navbar from "@/components/navbar";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "UniShare | Sign In",
  description: "Sign in to your UniShare account",
};

export default function SignInPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const message: Message = searchParams.error
    ? { error: searchParams.error }
    : searchParams.success
      ? { success: searchParams.success }
      : {};

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <form action={signInAction} className="flex flex-col space-y-6">
            <div className="space-y-2 text-center">
              <GraduationCap className="h-12 w-12 text-primary mx-auto mb-2" />
              <h1 className="text-3xl font-semibold tracking-tight">
                Welcome Back
              </h1>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  className="text-primary font-medium hover:underline transition-all"
                  href="/sign-up"
                >
                  Sign up
                </Link>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-all"
                    href="/forgot-password"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <PasswordInput
                    id="password"
                    name="password"
                    placeholder="Your password"
                    required
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <SubmitButton
              className="w-full bg-primary hover:bg-primary/90"
              pendingText="Signing in..."
            >
              Sign in
            </SubmitButton>

            {(message.error || message.success) && (
              <FormMessage message={message} />
            )}
          </form>
        </div>
      </div>
    </>
  );
}

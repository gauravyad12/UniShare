import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import MobileAwareNavbar from "@/components/mobile-aware-navbar";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import Link from "next/link";
import { Metadata } from "next";
import GradientWaveBackground from "@/components/gradient-wave-background";
import AnimatedLogo from "@/components/animated-logo";

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
      <MobileAwareNavbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
        <GradientWaveBackground />

        <div className="w-full max-w-md rounded-2xl border-0 bg-card/95 backdrop-blur-sm p-7 shadow-lg relative z-10 overflow-hidden">
          {/* Subtle gradient overlay for card */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-70 pointer-events-none"></div>

          <form action={signInAction} className="flex flex-col space-y-7 relative">
            <div className="space-y-3 text-center">
              <AnimatedLogo />
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
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

            <div className="space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5">
                  Email
                </Label>
                <div className="relative group">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="w-full h-11 pl-4 pr-4 rounded-xl border-muted bg-background/50 transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 group-hover:border-primary/30"
                  />
                  <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-1.5">
                    Password
                  </Label>
                  <Link
                    className="text-xs text-muted-foreground hover:text-primary transition-all"
                    href="/forgot-password"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative group">
                  <PasswordInput
                    id="password"
                    name="password"
                    placeholder="Your password"
                    required
                    className="w-full h-11 pl-4 pr-10 rounded-xl border-muted bg-background/50 transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 group-hover:border-primary/30"
                  />
                  <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                </div>
              </div>
            </div>

            <SubmitButton
              className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-3 shadow-md hover:shadow-lg"
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

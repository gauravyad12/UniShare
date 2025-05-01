import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions";
import MobileAwareNavbar from "@/components/mobile-aware-navbar";
import GradientWaveBackground from "@/components/gradient-wave-background";
import AnimatedLogo from "@/components/animated-logo";

export const dynamic = "force-dynamic";


export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  if ("message" in searchParams) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <>
      <MobileAwareNavbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
        <GradientWaveBackground />

        <div className="w-full max-w-md rounded-2xl border-0 bg-card/95 backdrop-blur-sm p-7 shadow-lg relative z-10 overflow-hidden">
          {/* Subtle gradient overlay for card */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-70 pointer-events-none"></div>

          <form className="flex flex-col space-y-7 relative">
            <div className="space-y-3 text-center">
              <AnimatedLogo />
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                Reset Password
              </h1>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  className="text-primary font-medium hover:underline transition-all"
                  href="/sign-in"
                >
                  Sign in
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
            </div>

            <SubmitButton
              formAction={forgotPasswordAction}
              pendingText="Sending reset link..."
              className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-3 shadow-md hover:shadow-lg"
            >
              Reset Password
            </SubmitButton>

            <FormMessage message={searchParams} />
          </form>
        </div>
      </div>
    </>
  );
}

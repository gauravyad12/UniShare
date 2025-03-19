import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import Link from "next/link";
import { signUpAction } from "@/app/actions";
import Navbar from "@/components/navbar";
import { GraduationCap } from "lucide-react";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  // Check if invite code exists in cookies (server-side)
  const cookiesStore = cookies();
  const hasInviteCode = cookiesStore.has("verified_invite_code");

  // Redirect if no invite code is found, but only if this isn't a redirect from verify-invite
  // Check if we're coming from verify-invite to prevent redirect loops
  const headersList = headers();
  const referer = headersList.get("referer") || "";
  const isFromVerifyInvite = referer.includes("/verify-invite");

  if (!hasInviteCode && !isFromVerifyInvite) {
    return redirect("/verify-invite");
  }

  if ("message" in searchParams) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <form className="flex flex-col space-y-6">
            <div className="space-y-2 text-center">
              <GraduationCap className="h-12 w-12 text-primary mx-auto mb-2" />
              <h1 className="text-3xl font-semibold tracking-tight">
                Join UniShare
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

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="John Doe"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  University Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@university.edu"
                  required
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Must be a valid university email address
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Choose a username"
                  required
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  This will be your public display name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <PasswordInput
                  id="password"
                  name="password"
                  placeholder="Your password"
                  minLength={8}
                  maxLength={50}
                  required
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Must be 8-50 characters with uppercase, lowercase, number, and
                  special character
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirm_password"
                  className="text-sm font-medium"
                >
                  Confirm Password
                </Label>
                <PasswordInput
                  id="confirm_password"
                  name="confirm_password"
                  placeholder="Confirm your password"
                  minLength={8}
                  maxLength={50}
                  required
                  className="w-full"
                />
              </div>

              {/* No need for hidden invite code field as we're using cookies now */}
            </div>

            <div className="text-xs text-muted-foreground text-center mb-4">
              By creating an account, you are agreeing to our{" "}
              <Link
                href="/terms-of-service"
                className="text-primary hover:underline transition-all"
              >
                Terms of Service
              </Link>
            </div>

            <SubmitButton
              formAction={signUpAction}
              pendingText="Signing up..."
              className="w-full bg-primary hover:bg-primary/90"
            >
              Sign up
            </SubmitButton>

            <FormMessage message={searchParams} />
          </form>
        </div>
      </div>
    </>
  );
}

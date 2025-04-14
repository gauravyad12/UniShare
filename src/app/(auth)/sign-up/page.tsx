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
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import SignUpForm from "@/components/sign-up-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UniShare | Sign Up",
  description: "Create your UniShare account",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const message: Message = searchParams.error
    ? { error: searchParams.error }
    : searchParams.success
      ? { success: searchParams.success }
      : {};

  // Check if invite code exists in cookies
  const cookieStore = cookies();
  const inviteCodeCookie = cookieStore.get("verified_invite_code");
  const hasInviteCode = !!inviteCodeCookie;

  // If no invite code, redirect to verify-invite page
  // Add a no_redirect parameter to prevent potential loops
  if (!hasInviteCode) {
    return redirect("/verify-invite?no_redirect=true");
  }

  // Verify the invite code is valid
  const supabase = createClient();
  const inviteCode = inviteCodeCookie?.value || "";

  if (!inviteCode) {
    return redirect(
      "/verify-invite?error=Invalid invite code&clear_cookie=true",
    );
  }

  // Verify invite code is valid with more comprehensive checks
  const { data: inviteData, error: inviteError } = await supabase
    .from("invite_codes")
    .select("id, code, university_id, is_active, max_uses, current_uses, expires_at")
    .ilike("code", inviteCode) // Case-insensitive matching
    .eq("is_active", true)
    .single();

  // If invite code is invalid, redirect to verify-invite
  if (inviteError || !inviteData) {
    return redirect(
      "/verify-invite?error=Invalid or expired invite code&clear_cookie=true",
    );
  }

  // Check if invite code has reached max uses
  if (inviteData.max_uses > 0 && inviteData.current_uses >= inviteData.max_uses) {
    return redirect(
      "/verify-invite?error=This invite code has reached its maximum usage limit&clear_cookie=true",
    );
  }

  // Check if invite code has expired
  if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
    return redirect(
      "/verify-invite?error=This invite code has expired&clear_cookie=true",
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <SignUpForm message={message} />
        </div>
      </div>
    </>
  );
}

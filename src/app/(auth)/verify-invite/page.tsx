import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import VerifyInviteClient from "./verify-invite-client";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "UniShare | Verify Invite Code",
  description: "Enter your invite code to join UniShare",
};

export default async function VerifyInvitePage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string; clear_cookie?: string; code?: string };
}) {
  // We'll handle cookie clearing in the client component
  // This is just a flag we'll pass to the client component
  const shouldClearCookie = searchParams.clear_cookie === "true";

  // Check if we already have a valid invite code in cookies
  const cookieStore = cookies();
  const inviteCodeCookie = cookieStore.get("verified_invite_code");

  // Only check cookie and redirect if we're not already handling a clear_cookie request
  // This prevents redirect loops
  if (inviteCodeCookie?.value && !shouldClearCookie) {
    // Verify the invite code is still valid
    const supabase = createClient();
    const { data: inviteData, error: inviteError } = await supabase
      .from("invite_codes")
      .select("id")
      .ilike("code", inviteCodeCookie.value)
      .eq("is_active", true)
      .single();

    // If the invite code is valid, redirect to sign-up
    if (!inviteError && inviteData) {
      // Only redirect if we don't have an error parameter
      // This prevents loops when coming back from sign-up with an error
      if (!searchParams.error) {
        return redirect("/sign-up");
      }
    } else {
      // If the invite code is invalid and we're not already clearing it,
      // redirect with clear_cookie flag
      return redirect("/verify-invite?error=Invalid invite code&clear_cookie=true");
    }
  }

  // Pass any search params to the client component
  return <VerifyInviteClient />;
}

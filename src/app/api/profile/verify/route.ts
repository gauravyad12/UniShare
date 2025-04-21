import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const adminClient = createAdminClient();

    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all invite codes created by the user
    const { data: inviteCodes, error: inviteCodesError } = await supabase
      .from("invite_codes")
      .select("id, current_uses")
      .eq("created_by", userData.user.id);

    if (inviteCodesError) {
      console.error("Error fetching invite codes:", inviteCodesError);
      return NextResponse.json(
        { error: "Failed to fetch invite codes" },
        { status: 500 },
      );
    }

    // Calculate total successful invites across all codes
    const totalInviteUses = inviteCodes?.reduce((total, code) => total + (code.current_uses || 0), 0) || 0;

    // Get successful sent invitations
    const { data: invitations, error } = await supabase
      .from("sent_invitations")
      .select("*")
      .eq("sent_by", userData.user.id)
      .eq("status", "used");

    if (error) {
      console.error("Error fetching invitations:", error);
      return NextResponse.json(
        { error: "Failed to fetch invitations" },
        { status: 500 },
      );
    }

    // Count successful invites from sent_invitations
    const successfulSentInvites = invitations?.length || 0;

    // Use the higher count between total uses and successful sent invites
    const successfulInvites = Math.max(totalInviteUses, successfulSentInvites);
    const requiredInvites = 5;
    const shouldBeVerified = successfulInvites >= requiredInvites;

    // Get current verification status
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("is_verified")
      .eq("id", userData.user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 },
      );
    }

    // If user should be verified but isn't, update their status
    if (shouldBeVerified && !profileData?.is_verified) {
      // Use admin client to update verification status
      if (!adminClient) {
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 },
        );
      }

      const { error: updateError } = await adminClient
        .from("user_profiles")
        .update({ is_verified: true, updated_at: new Date().toISOString() })
        .eq("id", userData.user.id);

      if (updateError) {
        console.error("Error updating verification status:", updateError);
        return NextResponse.json(
          { error: "Failed to update verification status" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Your profile has been verified!",
        verified: true,
        successfulInvites,
        requiredInvites,
      });
    }

    return NextResponse.json({
      success: true,
      verified: profileData?.is_verified || false,
      successfulInvites,
      requiredInvites,
      shouldBeVerified,
    });
  } catch (error) {
    console.error("Error in verify profile API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all invitations sent by the user
    const { data: invitations, error } = await supabase
      .from("sent_invitations")
      .select("*, invite_codes(code)")
      .eq("sent_by", userData.user.id)
      .order("sent_at", { ascending: false });

    if (error) {
      console.error("Error fetching invitations:", error);
      return NextResponse.json(
        { error: "Failed to fetch invitations" },
        { status: 500 },
      );
    }

    // Get all invite codes created by the user
    const { data: inviteCodes, error: inviteCodesError } = await supabase
      .from("invite_codes")
      .select("id, code, current_uses, max_uses")
      .eq("created_by", userData.user.id);

    if (inviteCodesError) {
      console.error("Error fetching invite codes:", inviteCodesError);
      return NextResponse.json(
        { error: "Failed to fetch invite codes" },
        { status: 500 },
      );
    }

    // Get verification status
    const { data: verificationData, error: verificationError } = await supabase
      .from("user_profiles")
      .select("is_verified")
      .eq("id", userData.user.id)
      .single();

    if (verificationError) {
      console.error("Error fetching verification status:", verificationError);
    }

    // Calculate total uses across all invite codes
    const totalInviteUses = inviteCodes?.reduce((total, code) => total + (code.current_uses || 0), 0) || 0;

    // Count successful invites from sent_invitations (for backward compatibility)
    const successfulSentInvites = invitations.filter(
      (inv) => inv.status === "used",
    ).length;

    // Use the higher count between total uses and successful sent invites
    // This ensures we count both direct uses and sent invitation uses
    const successfulInvites = Math.max(totalInviteUses, successfulSentInvites);

    // Calculate if the user has reached the maximum allowed invites
    const requiredInvites = 5;
    const hasReachedMaxInvites = successfulInvites >= requiredInvites;

    return NextResponse.json({
      success: true,
      invitations,
      inviteCodes,
      verificationStatus: {
        isVerified: verificationData?.is_verified || false,
        successfulInvites,
        requiredInvites,
        hasReachedMaxInvites,
        totalInviteUses
      },
    });
  } catch (error) {
    console.error("Error in list invitations API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

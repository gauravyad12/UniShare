import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    // Use regular client for auth
    const supabase = createClient();
    // Use admin client for database operations that need to bypass RLS
    const adminClient = createAdminClient();

    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's university ID
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("university_id")
      .eq("id", userData.user.id)
      .single();

    if (!profileData?.university_id) {
      return NextResponse.json(
        {
          error:
            "Your profile must have a university assigned to generate invite codes",
        },
        { status: 400 },
      );
    }

    // Generate a random 6-character alphanumeric code
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let newCode = "";
    for (let i = 0; i < 6; i++) {
      newCode += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }

    // Create new invite code in database using admin client to bypass RLS
    const { data: inviteData, error } = await adminClient
      .from("invite_codes")
      .insert({
        code: newCode,
        created_by: userData.user.id,
        university_id: profileData.university_id,
        is_active: true,
        max_uses: 5,
        current_uses: 0,
        created_at: new Date().toISOString(),
        expires_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 30 days from now
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating invite code:", error);
      return NextResponse.json(
        { error: "Failed to generate invite code: " + error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      inviteCode: inviteData,
    });
  } catch (error) {
    console.error("Error in generate invite code API:", error);
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred: " + (error.message || String(error)),
      },
      { status: 500 },
    );
  }
}

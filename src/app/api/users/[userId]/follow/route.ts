import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = params;
    const { action } = await request.json();

    // Prevent following yourself
    if (userId === user.id) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 },
      );
    }

    // Check if user exists
    const { data: targetUser, error: userError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "follow") {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from("user_followers")
        .select("*")
        .eq("user_id", userId)
        .eq("follower_id", user.id)
        .single();

      if (existingFollow) {
        return NextResponse.json(
          { error: "Already following this user" },
          { status: 400 },
        );
      }

      // Create follow relationship
      const { error: followError } = await supabase
        .from("user_followers")
        .insert({
          user_id: userId,
          follower_id: user.id,
          created_at: new Date().toISOString(),
        });

      if (followError) {
        return NextResponse.json(
          { error: "Failed to follow user" },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, action: "follow" });
    } else if (action === "unfollow") {
      // Delete follow relationship
      const { error: unfollowError } = await supabase
        .from("user_followers")
        .delete()
        .eq("user_id", userId)
        .eq("follower_id", user.id);

      if (unfollowError) {
        return NextResponse.json(
          { error: "Failed to unfollow user" },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, action: "unfollow" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in follow API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

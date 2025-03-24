import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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

    // Check if the current user is following the target user
    const { data, error } = await supabase
      .from("user_followers")
      .select("*")
      .eq("user_id", userId)
      .eq("follower_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error checking follow status:", error);
      return NextResponse.json(
        { error: "Failed to check follow status" },
        { status: 500 },
      );
    }

    return NextResponse.json({ isFollowing: !!data });
  } catch (error) {
    console.error("Error in follow status API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

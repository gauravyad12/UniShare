import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const supabase = createClient();
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Count followers (people following this user)
    const { count: followersCount, error: followersError } = await supabase
      .from("user_followers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (followersError) {
      console.error("Error counting followers:", followersError);
      return NextResponse.json(
        { error: "Failed to count followers" },
        { status: 500 },
      );
    }

    // Count following (people this user follows)
    const { count: followingCount, error: followingError } = await supabase
      .from("user_followers")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    if (followingError) {
      console.error("Error counting following:", followingError);
      return NextResponse.json(
        { error: "Failed to count following" },
        { status: 500 },
      );
    }

    // Return the counts
    return NextResponse.json({
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
    });
  } catch (error) {
    console.error("Error in follow stats API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

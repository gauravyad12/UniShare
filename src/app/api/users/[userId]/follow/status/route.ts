import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  console.log("Follow status API called for userId:", params.userId);
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
    console.log("Checking if user", user.id, "is following", userId);
    const { data, error } = await supabase
      .from("user_followers")
      .select("*")
      .eq("user_id", userId)
      .eq("follower_id", user.id)
      .maybeSingle();

    // Determine follow status - only log the result if there's an actual issue
    const isFollowing = Boolean(data); // Convert to boolean - null/undefined becomes false, object becomes true

    if (error) {
      console.error("Follow status error:", error);
    }

    if (error) {
      console.error("Error checking follow status:", error);
      return NextResponse.json(
        { error: "Failed to check follow status" },
        { status: 500 },
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

    // Ensure we have valid counts and follow status
    const result = {
      isFollowing: Boolean(data),
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
    };

    // Only log if in development environment
    if (process.env.NODE_ENV === "development") {
      console.log("Returning follow status:", result);
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in follow status API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

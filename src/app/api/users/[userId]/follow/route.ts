import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * Simplified follow/unfollow API with no RLS concerns
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    // Get target user ID from route params
    const targetUserId = params.userId;

    // Parse request body
    const body = await request.json();
    const action = body.action;

    if (!action || (action !== "follow" && action !== "unfollow")) {
      return NextResponse.json(
        { success: false, error: "Valid action (follow/unfollow) is required" },
        { status: 400 },
      );
    }

    // Get current user
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Prevent following yourself
    if (targetUserId === user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot follow yourself" },
        { status: 400 },
      );
    }

    // Check if target user exists
    const { data: targetUser } = await supabase
      .from("user_profiles")
      .select("id, username, full_name")
      .eq("id", targetUserId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Use admin client to bypass any RLS
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 },
      );
    }

    // Handle follow/unfollow
    if (action === "follow") {
      // Check if already following
      const { data: existing } = await adminClient
        .from("user_followers")
        .select("*")
        .eq("user_id", targetUserId)
        .eq("follower_id", user.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          success: true,
          message: "Already following this user",
        });
      }

      // Create follow relationship
      const { error: followError } = await adminClient
        .from("user_followers")
        .insert({
          user_id: targetUserId,
          follower_id: user.id,
          created_at: new Date().toISOString(),
        });

      if (followError) {
        console.error("Follow error:", followError);
        return NextResponse.json(
          { success: false, error: "Failed to follow user" },
          { status: 500 },
        );
      }

      // Create notification - Only create one notification
      try {
        // Get follower name
        const { data: profile } = await adminClient
          .from("user_profiles")
          .select("username, full_name")
          .eq("id", user.id)
          .single();

        const followerName =
          profile?.username || profile?.full_name || "Someone";

        // Check if a similar notification already exists to prevent duplicates
        const { data: existingNotifications } = await adminClient
          .from("notifications")
          .select("id")
          .eq("user_id", targetUserId)
          .eq("type", "follow")
          .eq("link", `/u/${profile?.username || user.id}`)
          .limit(1);

        // Only insert if no similar notification exists
        if (!existingNotifications || existingNotifications.length === 0) {
          // Insert notification directly with admin client
          await adminClient.from("notifications").insert({
            user_id: targetUserId,
            title: "New Follower",
            message: `${followerName} started following you`,
            type: "follow",
            is_read: false,
            created_at: new Date().toISOString(),
            link: `/u/${profile?.username || user.id}`,
          });
        }
      } catch (notifError) {
        // Log but don't fail the request
        console.error("Notification error (non-blocking):", notifError);
      }

      return NextResponse.json({
        success: true,
        action: "follow",
        message: `You are now following ${targetUser.username || targetUser.full_name || "this user"}`,
      });
    } else {
      // Unfollow action
      const { error: unfollowError } = await adminClient
        .from("user_followers")
        .delete()
        .eq("user_id", targetUserId)
        .eq("follower_id", user.id);

      if (unfollowError) {
        console.error("Unfollow error:", unfollowError);
        return NextResponse.json(
          { success: false, error: "Failed to unfollow user" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        action: "unfollow",
        message: `You have unfollowed ${targetUser.username || targetUser.full_name || "this user"}`,
      });
    }
  } catch (error) {
    console.error("Error in follow API:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Helper function to get the current like count
async function getLikeCount(supabase: any, resourceId: string) {
  try {
    // First try to get the count from the resources table
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("likes")
      .eq("id", resourceId)
      .single();

    if (!resourceError && resource && typeof resource.likes === "number") {
      return resource.likes;
    }

    // Fallback: Count directly from the resource_likes table
    const { count, error: countError } = await supabase
      .from("resource_likes")
      .select("*", { count: "exact" })
      .eq("resource_id", resourceId);

    if (!countError) {
      return count || 0;
    }

    return 0;
  } catch (err) {
    console.error("Error getting like count:", err);
    return 0;
  }
}

// Check if a user has liked a resource
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const resourceId = params.id;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 },
      );
    }

    // Check if user already liked this resource
    const { data: existingLike } = await supabase
      .from("resource_likes")
      .select("*")
      .eq("resource_id", resourceId)
      .eq("user_id", user.id)
      .single();

    // Get the current like count
    const likeCount = await getLikeCount(supabase, resourceId);

    return NextResponse.json({
      hasLiked: !!existingLike,
      likeCount,
    });
  } catch (error) {
    console.error(
      "Unexpected error:",
      error instanceof Error ? error.message : JSON.stringify(error, null, 2),
    );
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : JSON.stringify(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const resourceId = params.id;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 },
      );
    }

    // Check if user already liked this resource
    const { data: existingLike } = await supabase
      .from("resource_likes")
      .select("*")
      .eq("resource_id", resourceId)
      .eq("user_id", user.id)
      .single();

    if (existingLike) {
      // Return success with already liked status
      return NextResponse.json({
        success: true,
        alreadyLiked: true,
        likeCount: await getLikeCount(supabase, resourceId),
      });
    }

    // Add like record
    const { error: likeError } = await supabase.from("resource_likes").insert({
      resource_id: resourceId,
      user_id: user.id,
      created_at: new Date().toISOString(),
    });

    if (likeError) {
      console.error("Error adding like:", JSON.stringify(likeError, null, 2));
      return NextResponse.json(
        {
          error: `Failed to like resource: ${likeError.message || "Unknown error"}`,
        },
        { status: 500 },
      );
    }

    // Update resource likes count using a direct increment approach
    // This avoids the need to fetch the current value first
    const { error: updateError } = await supabase
      .rpc("increment_column_value", {
        p_table_name: "resources",
        p_column_name: "likes",
        p_record_id: resourceId,
        p_increment_by: 1,
      })
      .single();

    // Fallback to direct update if RPC fails (likely because the function doesn't exist yet)
    if (updateError) {
      console.error(
        "Error incrementing likes with RPC:",
        JSON.stringify(updateError, null, 2),
      );

      // Try direct update as fallback
      const { error: directUpdateError } = await supabase
        .from("resources")
        .update({
          likes: supabase.sql`COALESCE(likes, 0) + 1`,
        })
        .eq("id", resourceId);

      if (directUpdateError) {
        console.error(
          "Error updating likes count directly:",
          JSON.stringify(directUpdateError, null, 2),
        );
        // Continue despite error - the like was added successfully
      }
    }

    // Get the updated like count
    const likeCount = await getLikeCount(supabase, resourceId);

    return NextResponse.json({
      success: true,
      alreadyLiked: true,
      likeCount,
    });
  } catch (error) {
    console.error(
      "Unexpected error:",
      error instanceof Error ? error.message : JSON.stringify(error, null, 2),
    );
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : JSON.stringify(error),
      },
      { status: 500 },
    );
  }
}

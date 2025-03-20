import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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
      return NextResponse.json(
        { error: "You have already liked this resource" },
        { status: 400 },
      );
    }

    // Add like record
    const { error: likeError } = await supabase.from("resource_likes").insert({
      resource_id: resourceId,
      user_id: user.id,
      created_at: new Date().toISOString(),
    });

    if (likeError) {
      console.error("Error adding like:", likeError);
      return NextResponse.json(
        { error: "Failed to like resource" },
        { status: 500 },
      );
    }

    // Update resource likes count
    const { data: resource } = await supabase
      .from("resources")
      .select("likes")
      .eq("id", resourceId)
      .single();

    const currentLikes = resource?.likes || 0;

    const { error: updateError } = await supabase
      .from("resources")
      .update({
        likes: currentLikes + 1,
      })
      .eq("id", resourceId);

    if (updateError) {
      console.error("Error updating likes count:", updateError);
      // Continue despite error - the like was added successfully
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

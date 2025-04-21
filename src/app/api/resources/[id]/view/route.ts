import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


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

    // Get current view count
    const { data: resource } = await supabase
      .from("resources")
      .select("view_count")
      .eq("id", resourceId)
      .single();

    const currentViews = resource?.view_count || 0;

    // Update resource view count
    const { error: updateError } = await supabase
      .from("resources")
      .update({
        view_count: currentViews + 1,
      })
      .eq("id", resourceId);

    if (updateError) {
      console.error("Error updating view count:", updateError);
      return NextResponse.json(
        { error: "Failed to update view count" },
        { status: 500 },
      );
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

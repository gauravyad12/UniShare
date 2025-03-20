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

    // Record download
    const { error: downloadError } = await supabase
      .from("resource_downloads")
      .insert({
        resource_id: resourceId,
        user_id: user.id,
        downloaded_at: new Date().toISOString(),
      });

    if (downloadError) {
      console.error("Error recording download:", downloadError);
      // Continue despite error - we still want to allow the download
    }

    // Update resource downloads count
    const { data: resource } = await supabase
      .from("resources")
      .select("downloads")
      .eq("id", resourceId)
      .single();

    const currentDownloads = resource?.downloads || 0;

    const { error: updateError } = await supabase
      .from("resources")
      .update({
        downloads: currentDownloads + 1,
      })
      .eq("id", resourceId);

    if (updateError) {
      console.error("Error updating downloads count:", updateError);
      // Continue despite error - we still want to allow the download
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

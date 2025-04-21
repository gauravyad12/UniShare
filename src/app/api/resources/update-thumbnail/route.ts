import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { resourceId, thumbnailUrl } = body;
    
    if (!resourceId || !thumbnailUrl) {
      return NextResponse.json({ error: "Resource ID and thumbnail URL are required" }, { status: 400 });
    }
    
    console.log("Updating thumbnail URL for resource:", resourceId);
    console.log("New thumbnail URL:", thumbnailUrl);
    
    // Update the resource with the thumbnail URL
    const { error: updateError } = await supabase
      .from('resources')
      .update({ thumbnail_url: thumbnailUrl })
      .eq('id', resourceId);
    
    if (updateError) {
      console.error("Error updating resource with thumbnail URL:", updateError);
      return NextResponse.json({ error: "Failed to update resource" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

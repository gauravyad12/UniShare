import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Disconnect from Canvas API
export async function POST(request: NextRequest) {
  console.log("\n[Canvas API] Disconnecting from Canvas...");
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[Canvas API] Error: Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[Canvas API] Disconnecting Canvas integration for user: ${user.id}`);

    // Update the integration to disconnect
    const { error } = await supabase
      .from("user_canvas_integrations")
      .update({
        is_connected: false,
        access_token: null,
        refresh_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("[Canvas API] Error disconnecting Canvas integration:", error);
      return NextResponse.json(
        { error: "Failed to disconnect Canvas integration" },
        { status: 500 }
      );
    }

    console.log(`[Canvas API] Successfully disconnected Canvas integration`);
    return NextResponse.json({
      success: true,
      message: "Canvas integration disconnected",
    });
  } catch (error) {
    console.error("[Canvas API] Error disconnecting from Canvas:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

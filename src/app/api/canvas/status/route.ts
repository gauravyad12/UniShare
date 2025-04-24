import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get Canvas integration status
export async function GET(request: NextRequest) {
  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log("[Canvas API] Checking Canvas integration status...");
  }
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[Canvas API] Error: Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reduced logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Canvas API] Checking integration status for user: ${user.id}`);
    }

    // Get user's Canvas integration
    const { data: integration, error } = await supabase
      .from("user_canvas_integrations")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is expected if user has no integration
      console.error("[Canvas API] Error fetching Canvas integration:", error);
      return NextResponse.json(
        { error: "Failed to fetch Canvas integration status" },
        { status: 500 }
      );
    }

    // Minimal logging in production, more detailed in development
    if (process.env.NODE_ENV === 'development' && integration) {
      console.log(`[Canvas API] Found integration for domain: ${integration.domain}`);
      console.log(`[Canvas API] Integration status: ${integration.is_connected ? 'Connected' : 'Disconnected'}`);
      if (integration.gpa) {
        console.log(`[Canvas API] Current GPA: ${integration.gpa}`);
      }
    }

    return NextResponse.json({
      success: true,
      isConnected: integration?.is_connected || false,
      integration: integration || null,
    });
  } catch (error) {
    console.error("[Canvas API] Error getting Canvas status:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

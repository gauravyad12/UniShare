import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Update Canvas GPA
export async function POST(request: NextRequest) {
  console.log("\n[Canvas API] Updating GPA...");
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[Canvas API] Error: Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gpa } = await request.json();

    if (gpa === undefined) {
      console.log("[Canvas API] Error: GPA is required");
      return NextResponse.json(
        { error: "GPA is required" },
        { status: 400 }
      );
    }

    console.log(`[Canvas API] Updating GPA to: ${gpa}`);

    // Update the integration with the new GPA
    const { data, error } = await supabase
      .from("user_canvas_integrations")
      .update({
        gpa,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select();

    if (error) {
      console.error("[Canvas API] Error updating GPA:", error);
      return NextResponse.json(
        { error: "Failed to update GPA" },
        { status: 500 }
      );
    }

    console.log(`[Canvas API] Successfully updated GPA to: ${gpa}`);
    return NextResponse.json({
      success: true,
      message: "GPA updated",
      integration: data[0],
    });
  } catch (error) {
    console.error("[Canvas API] Error updating GPA:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

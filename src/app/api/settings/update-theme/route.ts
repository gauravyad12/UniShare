import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let theme;
    try {
      const body = await request.json();
      theme = body.theme;
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!theme) {
      return NextResponse.json({ error: "Theme is required" }, { status: 400 });
    }

    // Check if user settings exist
    const { data: existingSettings } = await supabase
      .from("user_settings")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .single();

    let updateMethod;
    if (!existingSettings) {
      // Create settings if they don't exist
      updateMethod = supabase.from("user_settings").insert({
        user_id: userData.user.id,
        theme_preference: theme,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      // Update existing settings
      updateMethod = supabase
        .from("user_settings")
        .update({
          theme_preference: theme,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userData.user.id);
    }

    const { error } = await updateMethod;

    if (error) {
      return NextResponse.json(
        { error: `Failed to update theme: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating theme:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

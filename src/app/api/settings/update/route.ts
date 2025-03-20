import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.json();
    const {
      email_notifications,
      study_group_notifications,
      resource_notifications,
      profile_visibility,
      theme_preference,
      color_scheme,
      font_size,
    } = formData;

    console.log("Received settings update:", {
      theme_preference,
      color_scheme,
      font_size,
    });

    // Check if user_settings record exists for this user
    const { data: existingSettings, error: checkError } = await supabase
      .from("user_settings")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    let updateMethod;
    if (checkError) {
      // If error is not found, we'll create a new record
      // Otherwise, return the error
      if (checkError.code !== "PGRST116") {
        console.error("Error checking settings:", checkError);
        return NextResponse.json(
          { error: "Failed to check settings" },
          { status: 500 },
        );
      }
    }

    if (!existingSettings) {
      // Record doesn't exist, insert new record
      updateMethod = supabase.from("user_settings").insert({
        user_id: user.id,
        email_notifications,
        study_group_notifications,
        resource_notifications,
        profile_visibility,
        theme_preference,
        color_scheme,
        font_size,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      // Record exists, update it
      updateMethod = supabase
        .from("user_settings")
        .update({
          email_notifications,
          study_group_notifications,
          resource_notifications,
          profile_visibility,
          theme_preference,
          color_scheme,
          font_size,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    const { error } = await updateMethod;

    if (error) {
      console.error("Error updating settings:", error);
      return NextResponse.json(
        { error: "Failed to update settings" },
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

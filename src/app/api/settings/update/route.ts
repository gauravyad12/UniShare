import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


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
      // With RLS disabled, we can use the regular client
      updateMethod = supabase.from("user_settings").insert({
        user_id: user.id,
        email_notifications:
          email_notifications !== undefined ? email_notifications : true,
        study_group_notifications:
          study_group_notifications !== undefined
            ? study_group_notifications
            : true,
        resource_notifications:
          resource_notifications !== undefined ? resource_notifications : true,
        profile_visibility:
          profile_visibility !== undefined ? profile_visibility : true,
        theme_preference: theme_preference || "system",
        color_scheme: color_scheme || "default",
        font_size: font_size || 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      // Record exists, update it
      // Create an update object with only defined values
      const updateObj: any = {
        updated_at: new Date().toISOString(),
      };

      // Only include fields that are defined
      if (email_notifications !== undefined) updateObj.email_notifications = email_notifications;
      if (study_group_notifications !== undefined) updateObj.study_group_notifications = study_group_notifications;
      if (resource_notifications !== undefined) updateObj.resource_notifications = resource_notifications;
      if (profile_visibility !== undefined) updateObj.profile_visibility = profile_visibility;
      if (theme_preference !== undefined) updateObj.theme_preference = theme_preference;
      if (color_scheme !== undefined) updateObj.color_scheme = color_scheme;
      if (font_size !== undefined) updateObj.font_size = font_size;

      updateMethod = supabase
        .from("user_settings")
        .update(updateObj)
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

    // Note: Resend audience updates are now handled in the frontend
    // to avoid rate limiting issues and to only update when the user
    // explicitly clicks the Save Settings button

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

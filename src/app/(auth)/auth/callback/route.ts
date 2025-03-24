import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirect_to = requestUrl.searchParams.get("redirect_to");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
    } else if (data?.user) {
      // Check if user profile exists, create if not
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!profileData) {
        console.log("Creating profile for user:", data.user.id);
        // Create user profile
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || "",
            username: data.user.user_metadata?.username
              ? data.user.user_metadata.username.toLowerCase()
              : null,
            created_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error("Error creating user profile:", profileError);
        }
      }

      // Check if user settings exist, create if not
      const { data: settingsData } = await supabase
        .from("user_settings")
        .select("user_id")
        .eq("user_id", data.user.id)
        .single();

      if (!settingsData) {
        console.log("Creating settings for user:", data.user.id);
        // Create user settings
        const { error: settingsError } = await supabase
          .from("user_settings")
          .insert({
            user_id: data.user.id,
            email_notifications: true,
            profile_visibility: true,
            theme_preference: "system",
            created_at: new Date().toISOString(),
          });

        if (settingsError) {
          console.error("Error creating user settings:", settingsError);
        }
      }
    }
  }

  // URL to redirect to after sign in process completes
  const redirectTo = redirect_to || "/dashboard";
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}

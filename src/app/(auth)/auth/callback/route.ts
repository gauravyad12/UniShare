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
        // Create user profile using admin client to bypass RLS
        const { createAdminClient } = await import(
          "../../../../../utils/supabase/admin"
        );
        const adminClient = createAdminClient();

        // Check if username already exists
        let username = data.user.user_metadata?.username
          ? data.user.user_metadata.username.toLowerCase()
          : null;

        if (username) {
          const { data: existingUsername } = await supabase
            .from("user_profiles")
            .select("id")
            .neq("id", data.user.id)
            .ilike("username", username)
            .limit(1);

          if (existingUsername && existingUsername.length > 0) {
            // Username already exists, append a random suffix
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            username = `${username}_${randomSuffix}`;
            console.log(`Username already exists, using ${username} instead`);
          }
        }

        let profileError = null;
        if (adminClient) {
          const { error } = await adminClient.from("user_profiles").insert({
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || "",
            username: username,
            created_at: new Date().toISOString(),
          });
          profileError = error;
        } else {
          // Fallback to regular client if admin client creation fails
          const { error } = await supabase.from("user_profiles").insert({
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || "",
            username: username,
            created_at: new Date().toISOString(),
          });
          profileError = error;
        }

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
        // Create user settings using admin client to bypass RLS
        // Use the admin client we created earlier or create a new one if needed
        const adminClient =
          adminClient ||
          (
            await import("../../../../../utils/supabase/admin")
          ).createAdminClient();

        let settingsError = null;
        if (adminClient) {
          const { error } = await adminClient.from("user_settings").insert({
            user_id: data.user.id,
            email_notifications: true,
            profile_visibility: true,
            theme_preference: "system",
            created_at: new Date().toISOString(),
          });
          settingsError = error;
        } else {
          // Fallback to regular client if admin client creation fails
          const { error } = await supabase.from("user_settings").insert({
            user_id: data.user.id,
            email_notifications: true,
            profile_visibility: true,
            theme_preference: "system",
            created_at: new Date().toISOString(),
          });
          settingsError = error;
        }

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

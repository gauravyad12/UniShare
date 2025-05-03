"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * Component that injects the Appilix user identity script
 * This allows Appilix to identify users by their email when sending push notifications
 */
export default function AppilixUserIdentity() {
  const [userIdentity, setUserIdentity] = useState<string | null>(null);

  useEffect(() => {
    const getUserIdentity = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();

        if (data.user?.email) {
          // First, just use the email as identity
          setUserIdentity(data.user.email);

          // Then try to get the username to create a more user-friendly identity
          try {
            const { data: profileData } = await supabase
              .from("user_profiles")
              .select("username, full_name")
              .eq("id", data.user.id)
              .single();

            if (profileData) {
              // If we have a username, use "username (email)" format
              // This makes it easier to identify users in the Appilix dashboard
              const displayName = profileData.full_name || profileData.username || data.user.email;
              setUserIdentity(`${displayName} <${data.user.email}>`);
            }
          } catch (profileError) {
            // If we can't get the profile, just use the email (already set above)
            console.error("Error getting user profile for Appilix:", profileError);
          }
        }
      } catch (error) {
        console.error("Error getting user data for Appilix:", error);
      }
    };

    getUserIdentity();
  }, []);

  // Only render the script if we have a user identity
  if (!userIdentity) return null;

  // Create the script content with the user's identity
  // Escape any special characters to prevent script injection
  const escapedIdentity = userIdentity.replace(/[\\'"]/g, '\\$&');
  const scriptContent = `var appilix_push_notification_user_identity = "${escapedIdentity}";`;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: scriptContent }} />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * Component that injects the Appilix user identity script
 * This allows Appilix to identify users by their email when sending push notifications
 * Only the user's email is used as the identity for privacy reasons
 */
export default function AppilixUserIdentity() {
  const [userIdentity, setUserIdentity] = useState<string | null>(null);

  useEffect(() => {
    const getUserIdentity = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();

        if (data.user?.email) {
          // Use only the email as identity
          setUserIdentity(data.user.email);
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

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { setAppilixIdentityCookie } from '@/utils/appilix-cookie';

/**
 * Component that sets up Appilix identity on the app-entry page
 * This ensures Appilix can identify users from the first page load
 */
export default function AppilixEntryIdentity() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();

        if (data.user?.email) {
          // Store the email
          setUserEmail(data.user.email);

          // Set the cookie
          setAppilixIdentityCookie(data.user.email);
        } else {
          // Fallback: Generate a random test identity (1-500)
          const randomId = Math.floor(Math.random() * 500) + 1;
          const testIdentity = `test-user-${randomId}@example.com`;

          // Store the test identity
          setUserEmail(testIdentity);

          // Set the cookie with test identity
          setAppilixIdentityCookie(testIdentity);
        }
      } catch (error) {
        // Fallback on error: Generate a random test identity (1-500)
        const randomId = Math.floor(Math.random() * 500) + 1;
        const testIdentity = `test-user-${randomId}@example.com`;

        // Store the test identity
        setUserEmail(testIdentity);

        // Set the cookie with test identity
        setAppilixIdentityCookie(testIdentity);
      }
    };

    getUserEmail();
  }, []);

  // Create the script content with the user's identity
  // Escape any special characters to prevent script injection
  const escapedEmail = userEmail ? userEmail.replace(/[\\'"]/g, '\\$&') : '';
  const scriptContent = `var appilix_push_notification_user_identity = "${escapedEmail}";`;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: scriptContent }} />
    </>
  );
}

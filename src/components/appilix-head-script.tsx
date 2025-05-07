'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Script from 'next/script';

/**
 * Component that adds an Appilix identity script to the head
 * This ensures the script is loaded as early as possible
 */
export default function AppilixHeadScript() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();

        if (data.user?.email) {
          setUserEmail(data.user.email);
        } else {
          // Fallback: Generate a random test identity (1-500)
          const randomId = Math.floor(Math.random() * 500) + 1;
          const testIdentity = `test-user-${randomId}@example.com`;
          setUserEmail(testIdentity);
        }
      } catch (error) {
        // Fallback on error: Generate a random test identity (1-500)
        const randomId = Math.floor(Math.random() * 500) + 1;
        const testIdentity = `test-user-${randomId}@example.com`;
        setUserEmail(testIdentity);
      }
    };

    getUserEmail();
  }, []);

  if (!userEmail) return null;

  // Escape any special characters to prevent script injection
  const escapedEmail = userEmail.replace(/[\\'"]/g, '\\$&');

  return (
    <Script id="appilix-identity-script" strategy="beforeInteractive">
      {`var appilix_push_notification_user_identity = "${escapedEmail}";`}
    </Script>
  );
}

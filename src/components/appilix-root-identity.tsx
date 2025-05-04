'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { setAppilixIdentityCookie } from '@/utils/appilix-cookie';

/**
 * Component that sets up Appilix identity on the root layout
 * This ensures Appilix can identify users from any page
 */
export default function AppilixRootIdentity() {
  useEffect(() => {
    const setIdentity = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();

        if (data.user?.email) {
          // Set the cookie
          setAppilixIdentityCookie(data.user.email);

          // Set the global variable directly
          // @ts-ignore - We're intentionally setting a global variable
          window.appilix_push_notification_user_identity = data.user.email;

          console.log('Appilix identity set on root layout for:', data.user.email);
        } else {
          // Fallback: Generate a random test identity (1-500)
          const randomId = Math.floor(Math.random() * 500) + 1;
          const testIdentity = `test-user-${randomId}@example.com`;

          // Set the cookie with test identity
          setAppilixIdentityCookie(testIdentity);

          // Set the global variable directly
          // @ts-ignore - We're intentionally setting a global variable
          window.appilix_push_notification_user_identity = testIdentity;

          console.log('Appilix test identity set on root layout:', testIdentity);
        }
      } catch (error) {
        console.error('Error setting Appilix identity on root layout:', error);

        // Fallback on error: Generate a random test identity (1-500)
        const randomId = Math.floor(Math.random() * 500) + 1;
        const testIdentity = `test-user-${randomId}@example.com`;

        // Set the cookie with test identity
        setAppilixIdentityCookie(testIdentity);

        // Set the global variable directly
        // @ts-ignore - We're intentionally setting a global variable
        window.appilix_push_notification_user_identity = testIdentity;

        console.log('Appilix test identity set on root layout after error:', testIdentity);
      }
    };

    // Set identity immediately
    setIdentity();

    // Also set it when the page becomes visible (user switches tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIdentity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // This component doesn't render anything
  return null;
}

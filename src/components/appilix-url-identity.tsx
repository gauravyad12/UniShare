'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Component that reads the Appilix user identity from URL parameters
 * This provides an alternative way to identify users for push notifications
 * in addition to the script tag approach
 */
export default function AppilixUrlIdentity() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if this is the Appilix app
    const isAppilix = /Appilix/i.test(navigator.userAgent);

    // Only process the URL parameter in the Appilix app
    if (isAppilix) {
      // Check if the URL has the Appilix user identity parameter
      const userIdentity = searchParams.get('appilix_push_notification_user_identity');

      if (userIdentity) {
        // Set the Appilix user identity variable
        // This is an alternative to the script tag approach
        // @ts-ignore - We're intentionally setting a global variable
        window.appilix_push_notification_user_identity = userIdentity;
      }
    }
  }, [searchParams]);

  // This component doesn't render anything
  return null;
}

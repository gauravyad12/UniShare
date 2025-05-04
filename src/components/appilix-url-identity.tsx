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
    // Check if this is a mobile device or Appilix app
    const isMobileOrApp = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Appilix/i.test(
      navigator.userAgent
    );

    // Only process the URL parameter on mobile devices or Appilix app
    if (isMobileOrApp) {
      // Check if the URL has the Appilix user identity parameter
      const userIdentity = searchParams.get('appilix_push_notification_user_identity');

      if (userIdentity) {
        // Set the Appilix user identity variable
        // This is an alternative to the script tag approach
        // @ts-ignore - We're intentionally setting a global variable
        window.appilix_push_notification_user_identity = userIdentity;

        // Log for debugging
        console.log('Appilix user identity set from URL parameter (mobile/app):', userIdentity);
      }
    }
  }, [searchParams]);

  // This component doesn't render anything
  return null;
}

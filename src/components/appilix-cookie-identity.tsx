'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { setAppilixIdentityCookie } from '@/utils/appilix-cookie';

/**
 * Component that sets the Appilix user identity cookie
 * This provides another way to identify users for push notifications
 * in addition to the script tag and URL parameter approaches
 */
export default function AppilixCookieIdentity() {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // Only run once
    if (isInitialized) return;
    
    const setUserIdentityCookie = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        
        if (data.user?.email) {
          // Set the Appilix identity cookie with the user's email
          setAppilixIdentityCookie(data.user.email);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error setting Appilix identity cookie:', error);
      }
    };
    
    setUserIdentityCookie();
  }, [isInitialized]);
  
  // This component doesn't render anything
  return null;
}

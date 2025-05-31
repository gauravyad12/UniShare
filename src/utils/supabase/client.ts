import { createBrowserClient } from "@supabase/ssr";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Add error handling for refresh token issues
  if (typeof window !== "undefined") {
    // Listen for auth state changes to handle refresh token errors
    supabaseClient.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('Token refresh failed, clearing local session');
        // Clear any stored auth data
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase.auth.token');
        
        // Redirect to sign-in if on a protected route
        if (window.location.pathname.startsWith('/dashboard')) {
          window.location.href = '/sign-in?error=Session expired. Please sign in again.';
        }
      }
      
      if (event === 'SIGNED_OUT') {
        // Clear any stored auth data on sign out
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase.auth.token');
      }
    });

    // Handle unhandled promise rejections that might be auth-related
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      if (error?.message?.includes('refresh_token_not_found') || 
          error?.message?.includes('Invalid Refresh Token')) {
        console.warn('Unhandled refresh token error detected, clearing session');
        event.preventDefault(); // Prevent the error from being logged to console
        
        // Clear auth state
        supabaseClient?.auth.signOut({ scope: 'local' });
        
        // Redirect if on protected route
        if (window.location.pathname.startsWith('/dashboard')) {
          window.location.href = '/sign-in?error=Session expired. Please sign in again.';
        }
      }
    });

    // Make supabase available globally for theme sync
    (window as any).supabaseClient = supabaseClient;
  }

  return supabaseClient;
}

// Helper function to handle auth errors gracefully
export function handleAuthError(error: any) {
  const isRefreshTokenError = error?.message?.includes('refresh_token_not_found') || 
                             error?.message?.includes('Invalid Refresh Token') ||
                             error?.code === 'refresh_token_not_found';
  
  if (isRefreshTokenError) {
    console.warn('Refresh token error detected, signing out locally');
    
    // Clear local session without making API call
    if (supabaseClient) {
      supabaseClient.auth.signOut({ scope: 'local' });
    }
    
    // Clear stored auth data
    if (typeof window !== "undefined") {
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      // Redirect to sign-in if on protected route
      if (window.location.pathname.startsWith('/dashboard')) {
        window.location.href = '/sign-in?error=Session expired. Please sign in again.';
      }
    }
    
    return true; // Indicates error was handled
  }
  
  return false; // Error was not a refresh token error
}

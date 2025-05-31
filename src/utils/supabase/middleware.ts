import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export function createClient(request: NextRequest) {
  const isDebug = process.env.NODE_ENV === "development";

  try {
    // Use environment variables instead of hardcoded values
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials missing in .env file");
      return null;
    }

    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name);
          return cookie?.value;
        },
        set(
          name: string,
          value: string,
          options: {
            path?: string;
            maxAge?: number;
            domain?: string;
            secure?: boolean;
            httpOnly?: boolean;
            sameSite?: "strict" | "lax" | "none";
          },
        ) {
          try {
            // If we're setting the auth cookie, update the request as well so that the session is available immediately
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          } catch (cookieError) {
            if (isDebug) {
              console.debug("Error setting cookie in middleware:", cookieError);
            }
            // Continue without setting cookies if there's an error
          }
        },
        remove(name: string, options: { path?: string; domain?: string }) {
          try {
            request.cookies.delete({
              name,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.delete({
              name,
              ...options,
            });
          } catch (cookieError) {
            if (isDebug) {
              console.debug("Error removing cookie in middleware:", cookieError);
            }
            // Continue without removing cookies if there's an error
          }
        },
      },
    });

    return { supabase, response };
  } catch (error) {
    console.error("Error creating Supabase client in middleware:", error);
    return null;
  }
}

// Helper function to clear all Supabase auth cookies
export function clearAuthCookies(response: NextResponse) {
  const authCookieNames = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'supabase.auth.token',
    // Add any other auth cookie patterns your app might use
  ];

  authCookieNames.forEach(cookieName => {
    response.cookies.delete({
      name: cookieName,
      path: '/',
    });
  });

  return response;
}

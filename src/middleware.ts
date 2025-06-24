import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "./utils/supabase/middleware";

// Helper function to get the appropriate base URL for redirects
function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || '3000';
    return `http://localhost:${port}`;
  }
  return `https://${process.env.NEXT_PUBLIC_DOMAIN}`;
}

// Helper function to clear auth cookies when session is invalid
function clearAuthCookies(response: NextResponse) {
  // Clear common Supabase auth cookie patterns
  const authCookiePatterns = [
    'sb-access-token',
    'sb-refresh-token', 
    'supabase-auth-token',
    'supabase.auth.token'
  ];
  
  authCookiePatterns.forEach(pattern => {
    response.cookies.delete(pattern);
  });
  
  return response;
}

// Helper function to handle authentication errors gracefully
function handleAuthError(error: any, pathname: string, isProtectedRoute: boolean) {
  const isRefreshTokenError = error?.message?.includes('refresh_token_not_found') || 
                             error?.message?.includes('Invalid Refresh Token') ||
                             error?.code === 'refresh_token_not_found';
  
  if (isRefreshTokenError) {
    console.warn('Invalid refresh token detected, clearing auth cookies');
    
    if (isProtectedRoute) {
      // For protected routes, redirect to sign-in and clear cookies
      const response = NextResponse.redirect(new URL('/sign-in?error=Session expired. Please sign in again.', getBaseUrl()));
      return clearAuthCookies(response);
    } else {
      // For non-protected routes, just clear cookies and continue
      const response = NextResponse.next();
      response.headers.set("x-middleware-cache", "no-cache");
      response.headers.set("Cache-Control", "no-store, max-age=0");
      return clearAuthCookies(response);
    }
  }
  
  // For other auth errors, log and continue
  console.error("Authentication error:", error);
  const response = NextResponse.next();
  response.headers.set("x-middleware-cache", "no-cache");
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export async function middleware(req: NextRequest) {
  try {
    // SECURITY FIX: Block requests with x-middleware-subrequest header to prevent authorization bypass
    // See: https://github.com/advisories/GHSA-f82v-jwr5-mffw
    // But allow specific subrequests for OG image generation and static assets
    if (req.headers.get('x-middleware-subrequest')) {
      const { pathname } = req.nextUrl;
      // Allow subrequests for static assets like the logo
      if (pathname.includes('android-chrome-512x512.png') ||
          pathname.includes('favicon.ico') ||
          pathname.includes('logo.png') ||
          pathname.startsWith('/public/') ||
          pathname.startsWith('/_next/')) {
        // Allow these subrequests
        return NextResponse.next();
      }

      console.warn('Blocked potential middleware authorization bypass attempt for:', pathname);
      return new NextResponse('Unauthorized', { status: 401 });
    }
    // Skip middleware for static assets, API routes, and error pages
    const { pathname } = req.nextUrl;
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api/") ||
      pathname.startsWith("/og-assets/") || // Skip for OG image assets
      pathname.startsWith("/u/") || // Skip for public profile pages
      pathname.startsWith("/roadmap/") || // Skip for public roadmap pages
      pathname.includes(".") || // Files with extensions like .jpg, .css, etc.
      pathname === "/error" || // Skip middleware for error page to prevent redirect loops
      pathname === "/fallback-error" || // Skip for fallback error page
      pathname.startsWith("/error/") || // Also skip for any error subpaths
      pathname.startsWith("/fallback-error/") || // Skip for fallback error subpaths
      pathname === "/favicon.ico" || // Skip for favicon
      pathname === "/" || // Skip for home page to prevent redirect loops
      pathname === "/universities" || // Skip for universities page
      pathname === "/success" // Skip for success page
    ) {
      const response = NextResponse.next();
      // Add cache control headers to prevent caching issues
      response.headers.set("x-middleware-cache", "no-cache");
      response.headers.set("Cache-Control", "no-store, max-age=0");
      return response;
    }

    // Use environment variables instead of hardcoded values
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        "Supabase credentials missing in .env file. Skipping auth checks.",
      );
      // Allow the request to proceed without auth checks if credentials are missing
      const response = NextResponse.next();
      response.headers.set("x-middleware-cache", "no-cache");
      response.headers.set("Cache-Control", "no-store, max-age=0");
      return response;
    }

    let supabase, response;
    try {
      const clientResult = createClient(req);
      if (!clientResult) {
        console.warn("Failed to create Supabase client. Skipping auth checks.");
        const response = NextResponse.next();
        response.headers.set("x-middleware-cache", "no-cache");
        response.headers.set("Cache-Control", "no-store, max-age=0");
        return response;
      }
      supabase = clientResult.supabase;
      response = clientResult.response;

      if (!supabase) {
        console.warn("Supabase client is null. Skipping auth checks.");
        const response = NextResponse.next();
        response.headers.set("x-middleware-cache", "no-cache");
        response.headers.set("Cache-Control", "no-store, max-age=0");
        return response;
      }
    } catch (clientError) {
      console.error("Failed to create Supabase client:", clientError);
      // Just proceed without auth checks if client creation fails
      const response = NextResponse.next();
      response.headers.set("x-middleware-cache", "no-cache");
      response.headers.set("Cache-Control", "no-store, max-age=0");
      return response;
    }

    const url = req.nextUrl;

    // Define protected and auth routes
    const isProtectedRoute = pathname.startsWith("/dashboard");
    const isAuthRoute = ["/sign-in", "/sign-up", "/forgot-password"].some(
      (route) => pathname.startsWith(route),
    );

    // Get user with enhanced validation and proper error handling
    let user;
    try {
      // First try to get the session - this is where refresh token errors typically occur
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        return handleAuthError(sessionError, pathname, isProtectedRoute);
      }

      const session = sessionData.session;

      // If we have a session, validate it
      if (session) {
        // Check if session is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at < currentTime) {
          console.warn("Session expired, clearing cookies and redirecting");
          if (isProtectedRoute) {
            const redirectResponse = NextResponse.redirect(new URL('/sign-in?error=Your session has expired. Please sign in again.', getBaseUrl()));
            return clearAuthCookies(redirectResponse);
          } else {
            const response = NextResponse.next();
            response.headers.set("x-middleware-cache", "no-cache");
            response.headers.set("Cache-Control", "no-store, max-age=0");
            return clearAuthCookies(response);
          }
        }

        // Get user data
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          return handleAuthError(userError, pathname, isProtectedRoute);
        }
        
        user = userData.user;

        // Additional validation for user and session consistency
        if (user && session) {
          // Check for suspicious activity (IP mismatch) - optional security check
        const clientIP = req.ip || req.headers.get("x-forwarded-for")?.split(",")[0].trim();
        const sessionIP = user.user_metadata?.last_sign_in_ip;

        if (sessionIP && clientIP && sessionIP !== clientIP) {
          console.warn(`IP mismatch detected: session IP ${sessionIP} vs current IP ${clientIP}`);
          // Log suspicious activity but don't block (could be legitimate IP change)
          }
        }
      }
    } catch (authError) {
      return handleAuthError(authError, pathname, isProtectedRoute);
    }

    // Handle protected routes
    if (isProtectedRoute && !user) {
      const redirectUrl = new URL('/sign-in', getBaseUrl());
      redirectUrl.searchParams.set("error", "Please sign in to access the dashboard");
      return NextResponse.redirect(redirectUrl);
    }

    // Handle auth routes when user is already logged in
    if (isAuthRoute && user) {
      const redirectUrl = new URL('/dashboard', getBaseUrl());
      return NextResponse.redirect(redirectUrl);
    }

    // Add security headers to prevent common attacks
    if (response) {
      // Cache control headers
      response.headers.set("x-middleware-cache", "no-cache");
      response.headers.set("Cache-Control", "no-store, max-age=0");

      // CSRF protection headers
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("X-Frame-Options", "SAMEORIGIN"); // Allow framing from same origin
      response.headers.set("X-XSS-Protection", "1; mode=block");

      // Content Security Policy to prevent XSS attacks
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://*.supabase.co';
      response.headers.set(
        "Content-Security-Policy",
        `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://js.stripe.com https://appilix.com https://va.vercel-scripts.com https://*.vercel-insights.com https://*.vercel-analytics.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src * data: blob:; font-src 'self' data:; connect-src * 'self'; frame-src 'self' https://js.stripe.com https://*.supabase.co ${supabaseUrl} https://yadi.sk https://*.yadi.sk https://*.yandex.ru https://*.yandex.com https://*.litsolutions.org https://*.litsolutions.net https://*.litsolutions.info; object-src 'self' https://*.supabase.co ${supabaseUrl}; media-src 'self' https://*.supabase.co ${supabaseUrl};`
      );

      // Referrer Policy
      response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    }

    return response || NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // Just proceed without auth checks if there's an error
    const response = NextResponse.next();
    response.headers.set("x-middleware-error", "true");
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|og-assets|public|api/payments/webhook|api/proxy|api/debug|api/restart|api/healthcheck|api/og|opengraph-image|twitter-image|sitemap.xml|robots.txt|covers.openlibrary.org|upload.wikimedia.org|cloud-api.yandex.net).*)",
  ],
};


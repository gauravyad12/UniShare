import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "./utils/supabase/middleware";

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

    // Refresh session if it exists
    try {
      await supabase.auth.getSession();
    } catch (sessionError) {
      console.error("Failed to get session:", sessionError);
      // Just proceed without auth checks if session refresh fails
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

    // Get user session
    let session;
    try {
      const { data } = await supabase.auth.getSession();
      session = data.session;
    } catch (sessionError) {
      console.error("Failed to get session data:", sessionError);
      if (isProtectedRoute) {
        url.pathname = "/sign-in";
        url.searchParams.set("error", "Authentication service unavailable");
        return NextResponse.redirect(url);
      }
      // For non-protected routes, just proceed without auth checks
      const response = NextResponse.next();
      response.headers.set("x-middleware-cache", "no-cache");
      response.headers.set("Cache-Control", "no-store, max-age=0");
      return response;
    }

    // Handle protected routes
    if (isProtectedRoute && !session) {
      url.pathname = "/sign-in";
      url.searchParams.set("error", "Please sign in to access the dashboard");
      return NextResponse.redirect(url);
    }

    // Handle auth routes when user is already logged in
    if (isAuthRoute && session) {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Add cache control headers to prevent caching issues
    if (response) {
      response.headers.set("x-middleware-cache", "no-cache");
      response.headers.set("Cache-Control", "no-store, max-age=0");
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
    "/((?!_next/static|_next/image|favicon.ico|og-assets|public|api/payments/webhook|api/debug|api/restart|api/healthcheck|opengraph-image|sitemap.xml|robots.txt).*)",
  ],
};

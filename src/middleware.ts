import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "./utils/supabase/middleware";

export async function middleware(req: NextRequest) {
  try {
    // Skip middleware for static assets, API routes, and error pages
    const { pathname } = req.nextUrl;
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api/") ||
      pathname.includes(".") || // Files with extensions like .jpg, .css, etc.
      pathname === "/error" || // Skip middleware for error page to prevent redirect loops
      pathname === "/fallback-error" || // Skip for fallback error page
      pathname.startsWith("/error/") || // Also skip for any error subpaths
      pathname.startsWith("/fallback-error/") || // Skip for fallback error subpaths
      pathname === "/favicon.ico" || // Skip for favicon
      pathname === "/" || // Skip for home page to prevent redirect loops
      pathname === "/universities" || // Skip for universities page
      pathname.startsWith("/tempobook/") // Skip for tempobook pages
    ) {
      return NextResponse.next();
    }

    // Hardcoded API keys for testing
    const supabaseUrl = "https://ncvinrzllkqlypnyluco.supabase.co";
    const supabaseKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdmlucnpsbGtxbHlwbnlsdWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNzIxMDMsImV4cCI6MjA1Nzc0ODEwM30.ZFTtxcCa4www7icBhNKaJBnLjqepNVIqRxamEEFarsI";

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        "Supabase credentials missing in .env file. Skipping auth checks.",
      );
      // Allow the request to proceed without auth checks if credentials are missing
      return NextResponse.next();
    }

    let supabase, response;
    try {
      const clientResult = createClient(req);
      if (!clientResult) {
        console.warn("Failed to create Supabase client. Skipping auth checks.");
        return NextResponse.next();
      }
      supabase = clientResult.supabase;
      response = clientResult.response;

      if (!supabase) {
        console.warn("Supabase client is null. Skipping auth checks.");
        return NextResponse.next();
      }
    } catch (clientError) {
      console.error("Failed to create Supabase client:", clientError);
      // Just proceed without auth checks if client creation fails
      return NextResponse.next();
    }

    // Refresh session if it exists
    try {
      await supabase.auth.getSession();
    } catch (sessionError) {
      console.error("Failed to get session:", sessionError);
      // Just proceed without auth checks if session refresh fails
      return NextResponse.next();
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
      return NextResponse.next();
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

    return response || NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // Just proceed without auth checks if there's an error
    return NextResponse.next();
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|api/payments/webhook).*)",
  ],
};

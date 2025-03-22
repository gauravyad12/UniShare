import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "./utils/supabase/middleware";

export async function middleware(req: NextRequest) {
  try {
    // Check if environment variables are available
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error("Supabase environment variables are missing");
      return NextResponse.next();
    }

    const { supabase, response } = createClient(req);

    // Refresh session if it exists
    await supabase.auth.getSession();

    const url = req.nextUrl;
    const { pathname } = url;

    // Define protected and auth routes
    const isProtectedRoute = pathname.startsWith("/dashboard");
    const isAuthRoute = ["/sign-in", "/sign-up", "/forgot-password"].some(
      (route) => pathname.startsWith(route),
    );

    // Skip middleware for static assets and API routes
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api/") ||
      pathname.includes(".") // Files with extensions like .jpg, .css, etc.
    ) {
      return response;
    }

    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

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

    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|api/payments/webhook).*)",
  ],
};

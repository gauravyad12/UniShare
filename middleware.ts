import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware that doesn't try to use Supabase or complex logic
export function middleware(request: NextRequest) {
  // Just pass through all requests for now to get the app working
  return NextResponse.next();
}

// Keep the matcher pattern simple
export const config = {
  matcher: [
    /*
     * Match all request paths except static files and API routes
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
};

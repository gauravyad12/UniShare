import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This middleware helps with handling Bad Gateway errors
export function middleware(request: NextRequest) {
  // SECURITY FIX: Block requests with x-middleware-subrequest header to prevent authorization bypass
  // See: https://github.com/advisories/GHSA-f82v-jwr5-mffw
  if (request.headers.get('x-middleware-subrequest')) {
    console.warn('Blocked potential middleware authorization bypass attempt');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Get the pathname from the URL
  const pathname = request.nextUrl.pathname;

  // Add custom headers to help with debugging
  const response = NextResponse.next();
  response.headers.set("x-middleware-cache", "no-cache");
  response.headers.set("Cache-Control", "no-store, max-age=0");

  // Add a custom header to track middleware execution
  response.headers.set("x-middleware-handled", "true");

  // Log the request for debugging
  console.log(`Middleware processing: ${pathname}`);

  return response;
}

// Configure which paths this middleware runs on
export const config = {
  // Skip static files and API routes to avoid unnecessary processing
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

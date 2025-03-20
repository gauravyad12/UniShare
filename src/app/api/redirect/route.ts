import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect to the new profile URL pattern
  return NextResponse.redirect(
    new URL(`/profile?username=${username}`, request.url),
  );
}

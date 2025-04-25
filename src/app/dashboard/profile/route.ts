import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Redirect to the edit profile page
  return NextResponse.redirect(new URL("/dashboard/profile/edit", request.url));
}

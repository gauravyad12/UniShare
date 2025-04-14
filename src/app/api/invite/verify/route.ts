import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json(
        { valid: false, error: "Invite code is required" },
        { status: 400 }
      );
    }

    // Check if the invite code exists and is valid
    const { data: inviteData, error: inviteError } = await supabase
      .from("invite_codes")
      .select(
        "id, code, university_id, is_active, max_uses, current_uses, expires_at, universities!invite_codes_university_id_fkey(domain)"
      )
      .ilike("code", inviteCode) // Case-insensitive matching
      .single();

    if (inviteError || !inviteData) {
      return NextResponse.json(
        { valid: false, error: "Invalid invite code" },
        { status: 200 } // Using 200 to handle this on the client side
      );
    }

    // Check if invite code is active
    if (!inviteData.is_active) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invite code is no longer active",
        },
        { status: 200 }
      );
    }

    // Check if invite code has reached max uses
    if (
      inviteData.max_uses > 0 &&
      inviteData.current_uses >= inviteData.max_uses
    ) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invite code has reached maximum usage limit",
        },
        { status: 200 }
      );
    }

    // Check if invite code has expired
    if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: "Invite code has expired" },
        { status: 200 }
      );
    }

    // Get university information from the joined data
    const universityDomain = inviteData.universities?.domain;

    // Set the cookie in the response
    const response = NextResponse.json(
      {
        valid: true,
        university_id: inviteData.university_id,
        invite_code_id: inviteData.id,
        university_domain: universityDomain,
      },
      { status: 200 }
    );

    // Set the cookie in the response
    response.cookies.set("verified_invite_code", inviteCode, {
      path: "/",
      maxAge: 3600, // 1 hour
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Error verifying invite code:", error);
    return NextResponse.json(
      { valid: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Also handle GET requests to check if an invite code exists in cookies
export async function GET() {
  try {
    const cookieStore = cookies();
    const inviteCodeCookie = cookieStore.get("verified_invite_code");
    const inviteCode = inviteCodeCookie?.value || "";

    if (!inviteCode) {
      return NextResponse.json(
        { valid: false, error: "No invite code found" },
        { status: 200 }
      );
    }

    // Verify the invite code is still valid
    const supabase = createClient();
    const { data: inviteData, error: inviteError } = await supabase
      .from("invite_codes")
      .select("id, university_id, is_active, max_uses, current_uses, expires_at")
      .ilike("code", inviteCode)
      .eq("is_active", true)
      .single();

    if (inviteError || !inviteData) {
      // Create response with error message
      const response = NextResponse.json(
        { valid: false, error: "Invalid or expired invite code" },
        { status: 200 }
      );

      // Clear the invalid cookie in the response
      response.cookies.delete("verified_invite_code");

      return response;
    }

    // Check if invite code has reached max uses
    if (
      inviteData.max_uses > 0 &&
      inviteData.current_uses >= inviteData.max_uses
    ) {
      // Create response with error message
      const response = NextResponse.json(
        { valid: false, error: "Invite code has reached maximum usage limit" },
        { status: 200 }
      );

      // Clear the invalid cookie in the response
      response.cookies.delete("verified_invite_code");

      return response;
    }

    // Check if invite code has expired
    if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
      // Create response with error message
      const response = NextResponse.json(
        { valid: false, error: "Invite code has expired" },
        { status: 200 }
      );

      // Clear the invalid cookie in the response
      response.cookies.delete("verified_invite_code");

      return response;
    }

    // Create successful response
    const response = NextResponse.json(
      {
        valid: true,
        code: inviteCode,
        university_id: inviteData.university_id,
        invite_code_id: inviteData.id,
      },
      { status: 200 }
    );

    return response;
  } catch (error) {
    console.error("Error checking invite code:", error);
    return NextResponse.json(
      { valid: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Handle DELETE requests to clear the invite code cookie
export async function DELETE() {
  try {
    // Create response
    const response = NextResponse.json(
      { success: true, message: "Invite code cookie cleared" },
      { status: 200 }
    );

    // Clear the cookie in the response
    response.cookies.delete("verified_invite_code", { path: "/" });

    return response;
  } catch (error) {
    console.error("Error clearing invite code cookie:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

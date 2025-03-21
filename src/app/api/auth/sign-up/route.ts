import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body instead of form data
    const body = await request.json();
    const { email, password, full_name, username } = body;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const supabase = createClient();

    // Check username availability
    if (username) {
      const { data: existingUser, error: usernameError } = await supabase
        .from("user_profiles")
        .select("username")
        .ilike("username", username)
        .limit(1);

      if (usernameError) {
        return NextResponse.json(
          { error: "Error checking username availability" },
          { status: 500 },
        );
      }

      if (existingUser && existingUser.length > 0) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 },
        );
      }
    }

    // Get invite code from cookie
    let inviteCode = "";
    try {
      // Try to get invite code from cookies
      const cookieStore = cookies();
      const inviteCodeCookie = cookieStore.get("verified_invite_code");
      inviteCode = inviteCodeCookie?.value || "";

      // If we couldn't get it from cookies, use a fallback for development
      if (!inviteCode) {
        inviteCode = "UCF2024"; // Fallback for development
        console.log("Using fallback invite code for development:", inviteCode);
      }
    } catch (error) {
      console.error("Error getting invite code cookie:", error);
      return NextResponse.json(
        { error: "Error retrieving invite code. Please try again." },
        { status: 500 },
      );
    }

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 },
      );
    }

    // Check if email domain is from a supported university
    const emailDomain = email.split("@")[1];
    if (!emailDomain) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Check if the domain exists in our universities table
    const { data: universityData, error: universityError } = await supabase
      .from("universities")
      .select("id, domain, name")
      .eq("domain", emailDomain)
      .single();

    if (universityError || !universityData) {
      return NextResponse.json(
        {
          error:
            "Your university email domain is not supported. Please contact support.",
        },
        { status: 400 },
      );
    }

    // Verify invite code (case-insensitive)
    const { data: inviteData, error: inviteError } = await supabase
      .from("invite_codes")
      .select("*, universities!invite_codes_university_id_fkey(domain)")
      .ilike("code", inviteCode) // Use case-insensitive matching
      .eq("is_active", true)
      .single();

    if (inviteError || !inviteData) {
      return NextResponse.json(
        { error: "Invalid or expired invite code" },
        { status: 400 },
      );
    }

    // Sign up the user
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || "",
          email: email,
          username: username,
        },
        emailRedirectTo: `${request.headers.get("origin")}/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (user) {
      try {
        // Update invite code usage count
        await supabase
          .from("invite_codes")
          .update({ current_uses: (inviteData.current_uses || 0) + 1 })
          .eq("id", inviteData.id);

        // Create user profile with university info from invite code
        await supabase.from("user_profiles").insert({
          id: user.id,
          full_name: full_name || "",
          username: username,
          university_id: universityData.id,
          university_name: universityData.name,
          invite_code_id: inviteData.id,
          created_at: new Date().toISOString(),
          is_verified: false,
        });

        // Try to clear the invite code cookie
        try {
          const cookieStore = cookies();
          cookieStore.delete("verified_invite_code");
        } catch (cookieError) {
          console.error("Error removing invite code cookie:", cookieError);
          // Continue despite cookie removal error
        }

        return NextResponse.json({
          success: true,
          message:
            "User created successfully. Please check your email for verification.",
        });
      } catch (err) {
        console.error("Error creating user profile:", err);
        return NextResponse.json({
          success: true,
          message:
            "User created but there was an issue with profile creation. Please contact support.",
        });
      }
    } else {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in sign-up API route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}

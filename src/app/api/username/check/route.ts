import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    // Check if username already exists (case-insensitive)
    const { data, error } = await supabase
      .from("user_profiles")
      .select("username")
      .ilike("username", username)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is what we want
      console.error("Error checking username:", error);
      return NextResponse.json(
        { error: "Failed to check username" },
        { status: 500 },
      );
    }

    // If data exists, username is taken
    return NextResponse.json({ available: !data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

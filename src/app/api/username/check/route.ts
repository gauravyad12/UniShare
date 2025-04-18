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

    // Get all usernames that match exactly (case-insensitive)
    // We use ilike for case-insensitive exact matching
    const { data, error } = await supabase
      .from("user_profiles")
      .select("username")
      .ilike("username", username.toLowerCase());

    if (error) {
      console.error("Error checking username:", error);
      return NextResponse.json(
        { error: "Failed to check username" },
        { status: 500 },
      );
    }

    // If we found any matches, the username is taken
    const isAvailable = !data || data.length === 0;

    return NextResponse.json({ available: isAvailable });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

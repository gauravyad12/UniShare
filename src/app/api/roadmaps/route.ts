import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/roadmaps - Get user's roadmaps
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile (user.id matches user_profiles.id directly)
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get user's roadmaps with related data
    const { data: roadmaps, error } = await supabase
      .from("degree_roadmaps")
      .select(`
        *,
        universities(name, logo_url),
        roadmap_semesters(
          *,
          roadmap_courses(*)
        )
      `)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching roadmaps:", error);
      return NextResponse.json(
        { error: "Failed to fetch roadmaps" },
        { status: 500 }
      );
    }

    return NextResponse.json({ roadmaps });
  } catch (error) {
    console.error("Error in GET /api/roadmaps:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/roadmaps - Create a new roadmap
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile (user.id matches user_profiles.id directly)
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      major,
      university_id,
      total_credits = 120,
      expected_graduation,
      is_public = false,
      description
    } = body;

    // Validate required fields
    if (!name || !major) {
      return NextResponse.json(
        { error: "Name and major are required" },
        { status: 400 }
      );
    }

    // Check for bad words in text fields
    const { containsBadWords } = await import('@/utils/badWords');

    // Check roadmap name for bad words
    if (name && await containsBadWords(name)) {
      return NextResponse.json(
        { error: "Roadmap name contains inappropriate language" },
        { status: 400 }
      );
    }

    // Check major for bad words
    if (major && await containsBadWords(major)) {
      return NextResponse.json(
        { error: "Major contains inappropriate language" },
        { status: 400 }
      );
    }

    // Check description for bad words
    if (description && await containsBadWords(description)) {
      return NextResponse.json(
        { error: "Description contains inappropriate language" },
        { status: 400 }
      );
    }

    // Create the roadmap
    const { data: roadmap, error } = await supabase
      .from("degree_roadmaps")
      .insert({
        user_id: profile.id,
        name,
        major,
        university_id,
        total_credits,
        expected_graduation,
        is_public,
        description
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating roadmap:", error);
      return NextResponse.json(
        { error: "Failed to create roadmap" },
        { status: 500 }
      );
    }

    return NextResponse.json({ roadmap }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/roadmaps:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
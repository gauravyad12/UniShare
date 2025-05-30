import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/roadmaps/[id]/semesters - Get semesters for a roadmap
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const roadmapId = params.id;
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile
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

    // Verify user owns the roadmap
    const { data: roadmap } = await supabase
      .from("degree_roadmaps")
      .select("id")
      .eq("id", roadmapId)
      .eq("user_id", profile.id)
      .single();

    if (!roadmap) {
      return NextResponse.json(
        { error: "Roadmap not found or access denied" },
        { status: 404 }
      );
    }

    // Get semesters with their courses
    const { data: semesters, error } = await supabase
      .from("roadmap_semesters")
      .select(`
        *,
        roadmap_courses(*)
      `)
      .eq("roadmap_id", roadmapId)
      .order("year")
      .order("sort_order");

    if (error) {
      console.error("Error fetching semesters:", error);
      return NextResponse.json(
        { error: "Failed to fetch semesters" },
        { status: 500 }
      );
    }

    return NextResponse.json({ semesters });
  } catch (error) {
    console.error("Error in GET /api/roadmaps/[id]/semesters:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/roadmaps/[id]/semesters - Add a semester to a roadmap
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const roadmapId = params.id;
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile
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

    // Verify user owns the roadmap
    const { data: roadmap } = await supabase
      .from("degree_roadmaps")
      .select("id")
      .eq("id", roadmapId)
      .eq("user_id", profile.id)
      .single();

    if (!roadmap) {
      return NextResponse.json(
        { error: "Roadmap not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      year,
      season,
      sort_order = 0
    } = body;

    // Validate required fields
    if (!name || !year || !season) {
      return NextResponse.json(
        { error: "Name, year, and season are required" },
        { status: 400 }
      );
    }

    // Validate season
    if (!['Fall', 'Spring', 'Summer'].includes(season)) {
      return NextResponse.json(
        { error: "Season must be Fall, Spring, or Summer" },
        { status: 400 }
      );
    }

    // Check if semester already exists for this roadmap
    const { data: existingSemester } = await supabase
      .from("roadmap_semesters")
      .select("id")
      .eq("roadmap_id", roadmapId)
      .eq("year", year)
      .eq("season", season)
      .single();

    if (existingSemester) {
      return NextResponse.json(
        { error: "A semester with this year and season already exists" },
        { status: 400 }
      );
    }

    // Create the semester
    const { data: semester, error } = await supabase
      .from("roadmap_semesters")
      .insert({
        roadmap_id: roadmapId,
        name,
        year,
        season,
        sort_order
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating semester:", error);
      return NextResponse.json(
        { error: "Failed to create semester" },
        { status: 500 }
      );
    }

    return NextResponse.json({ semester }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/roadmaps/[id]/semesters:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/roadmaps/[id]/semesters - Delete a semester from a roadmap
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const roadmapId = params.id;
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile
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

    // Verify user owns the roadmap
    const { data: roadmap } = await supabase
      .from("degree_roadmaps")
      .select("id")
      .eq("id", roadmapId)
      .eq("user_id", profile.id)
      .single();

    if (!roadmap) {
      return NextResponse.json(
        { error: "Roadmap not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { semesterId } = body;

    if (!semesterId) {
      return NextResponse.json(
        { error: "Semester ID is required" },
        { status: 400 }
      );
    }

    // Verify the semester belongs to this roadmap
    const { data: semester } = await supabase
      .from("roadmap_semesters")
      .select("id")
      .eq("id", semesterId)
      .eq("roadmap_id", roadmapId)
      .single();

    if (!semester) {
      return NextResponse.json(
        { error: "Semester not found or doesn't belong to this roadmap" },
        { status: 404 }
      );
    }

    // Delete all courses in the semester first (due to foreign key constraints)
    const { error: coursesError } = await supabase
      .from("roadmap_courses")
      .delete()
      .eq("semester_id", semesterId);

    if (coursesError) {
      console.error("Error deleting courses:", coursesError);
      return NextResponse.json(
        { error: "Failed to delete courses in semester" },
        { status: 500 }
      );
    }

    // Delete the semester
    const { error } = await supabase
      .from("roadmap_semesters")
      .delete()
      .eq("id", semesterId)
      .eq("roadmap_id", roadmapId);

    if (error) {
      console.error("Error deleting semester:", error);
      return NextResponse.json(
        { error: "Failed to delete semester" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/roadmaps/[id]/semesters:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
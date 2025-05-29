import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/roadmaps/[id]/courses - Get courses for a roadmap
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

    // Get courses for the roadmap
    const { data: courses, error } = await supabase
      .from("roadmap_courses")
      .select(`
        *,
        roadmap_semesters(name, year, season)
      `)
      .eq("roadmap_id", roadmapId)
      .order("sort_order");

    if (error) {
      console.error("Error fetching courses:", error);
      return NextResponse.json(
        { error: "Failed to fetch courses" },
        { status: 500 }
      );
    }

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error in GET /api/roadmaps/[id]/courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/roadmaps/[id]/courses - Add a course to a roadmap
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
      semester_id,
      course_code,
      course_name,
      credits = 3,
      status = 'planned',
      grade,
      grade_points,
      professor,
      difficulty_rating,
      professor_rating,
      description,
      prerequisites,
      notes,
      professor_data
    } = body;

    // Validate required fields
    if (!semester_id || !course_code || !course_name) {
      return NextResponse.json(
        { error: "Semester ID, course code, and course name are required" },
        { status: 400 }
      );
    }

    // Verify the semester belongs to this roadmap
    const { data: semester } = await supabase
      .from("roadmap_semesters")
      .select("id")
      .eq("id", semester_id)
      .eq("roadmap_id", roadmapId)
      .single();

    if (!semester) {
      return NextResponse.json(
        { error: "Semester not found or doesn't belong to this roadmap" },
        { status: 400 }
      );
    }

    // Create the course
    const { data: course, error } = await supabase
      .from("roadmap_courses")
      .insert({
        roadmap_id: roadmapId,
        semester_id,
        course_code: course_code.toUpperCase(),
        course_name,
        credits,
        status,
        grade,
        grade_points,
        professor,
        difficulty_rating,
        professor_rating,
        description,
        prerequisites,
        notes,
        professor_data
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating course:", error);
      return NextResponse.json(
        { error: "Failed to create course" },
        { status: 500 }
      );
    }

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/roadmaps/[id]/courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/roadmaps/[id]/courses - Update a course in a roadmap
export async function PUT(
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
      id: courseId,
      semester_id,
      course_code,
      course_name,
      credits = 3,
      status = 'planned',
      grade,
      grade_points,
      professor,
      difficulty_rating,
      professor_rating,
      description,
      prerequisites,
      notes,
      professor_data
    } = body;

    // Validate required fields
    if (!courseId || !semester_id || !course_code || !course_name) {
      return NextResponse.json(
        { error: "Course ID, semester ID, course code, and course name are required" },
        { status: 400 }
      );
    }

    // Verify the course belongs to this roadmap
    const { data: existingCourse } = await supabase
      .from("roadmap_courses")
      .select("id")
      .eq("id", courseId)
      .eq("roadmap_id", roadmapId)
      .single();

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Course not found or doesn't belong to this roadmap" },
        { status: 404 }
      );
    }

    // Verify the semester belongs to this roadmap
    const { data: semester } = await supabase
      .from("roadmap_semesters")
      .select("id")
      .eq("id", semester_id)
      .eq("roadmap_id", roadmapId)
      .single();

    if (!semester) {
      return NextResponse.json(
        { error: "Semester not found or doesn't belong to this roadmap" },
        { status: 400 }
      );
    }

    // Update the course
    const { data: course, error } = await supabase
      .from("roadmap_courses")
      .update({
        semester_id,
        course_code: course_code.toUpperCase(),
        course_name,
        credits,
        status,
        grade,
        grade_points,
        professor,
        difficulty_rating,
        professor_rating,
        description,
        prerequisites,
        notes,
        professor_data,
        updated_at: new Date().toISOString()
      })
      .eq("id", courseId)
      .eq("roadmap_id", roadmapId)
      .select()
      .single();

    if (error) {
      console.error("Error updating course:", error);
      return NextResponse.json(
        { error: "Failed to update course" },
        { status: 500 }
      );
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Error in PUT /api/roadmaps/[id]/courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/roadmaps/[id]/courses - Delete a course from a roadmap
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
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Verify the course belongs to this roadmap
    const { data: existingCourse } = await supabase
      .from("roadmap_courses")
      .select("id")
      .eq("id", courseId)
      .eq("roadmap_id", roadmapId)
      .single();

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Course not found or doesn't belong to this roadmap" },
        { status: 404 }
      );
    }

    // Delete the course
    const { error } = await supabase
      .from("roadmap_courses")
      .delete()
      .eq("id", courseId)
      .eq("roadmap_id", roadmapId);

    if (error) {
      console.error("Error deleting course:", error);
      return NextResponse.json(
        { error: "Failed to delete course" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/roadmaps/[id]/courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
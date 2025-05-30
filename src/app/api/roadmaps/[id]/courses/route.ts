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

    // Update roadmap GPA
    await updateRoadmapGPA(supabase, roadmapId);

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

    // Update roadmap GPA
    await updateRoadmapGPA(supabase, roadmapId);

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

    // Update roadmap GPA
    await updateRoadmapGPA(supabase, roadmapId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/roadmaps/[id]/courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to calculate and update roadmap GPA
async function updateRoadmapGPA(supabase: any, roadmapId: string) {
  try {
    // Get all courses for this roadmap with grades
    const { data: courses } = await supabase
      .from("roadmap_courses")
      .select("credits, grade, status")
      .eq("roadmap_id", roadmapId);

    if (!courses) return;

    // Calculate GPA using the same logic as the frontend
    const coursesWithGrades = courses.filter((course: any) => 
      (course.status === 'completed' || course.status === 'failed') && 
      course.grade && 
      course.grade.trim() !== ''
    );

    if (coursesWithGrades.length === 0) {
      // No graded courses, set GPA to 0
      await supabase
        .from("degree_roadmaps")
        .update({ current_gpa: 0.0 })
        .eq("id", roadmapId);
      return;
    }

    // Grade point mapping
    const gradePoints: { [key: string]: number | null } = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0,
      // Special grades that don't count toward GPA
      'W': null, 'I': null, 'P': null, 'NP': null
    };

    let totalGradePoints = 0;
    let totalCredits = 0;

    for (const course of coursesWithGrades) {
      const grade = course.grade.trim();
      const gradePoint = gradePoints[grade];
      
      // Skip courses with grades that don't count toward GPA
      if (gradePoint === null || gradePoint === undefined) {
        continue;
      }

      totalGradePoints += gradePoint * course.credits;
      totalCredits += course.credits;
    }

    const calculatedGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0.0;

    // Update the roadmap's current_gpa
    await supabase
      .from("degree_roadmaps")
      .update({ current_gpa: calculatedGPA })
      .eq("id", roadmapId);

  } catch (error) {
    console.error("Error updating roadmap GPA:", error);
    // Don't throw error to avoid breaking the main operation
  }
} 
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Toggle course exclusion from GPA calculation
export async function POST(request: NextRequest) {
  console.log("\n[Canvas API] Toggling course exclusion...");
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[Canvas API] Error: Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, excluded, courses: requestCourses } = await request.json();

    if (courseId === undefined) {
      console.log("[Canvas API] Error: Course ID is required");
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    console.log(`[Canvas API] Toggling course ${courseId} exclusion to: ${excluded}`);

    // Get user's Canvas integration
    const { data: integration, error: integrationError } = await supabase
      .from("user_canvas_integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_connected", true)
      .single();

    if (integrationError || !integration) {
      console.log("[Canvas API] Error: Canvas integration not found or not connected");
      return NextResponse.json(
        { error: "Canvas integration not found or not connected" },
        { status: 404 }
      );
    }

    // We don't store courses in the database anymore
    // This API is now only used to update the GPA in the database
    // The courses are managed in localStorage on the client side
    // This endpoint should be called with the updated courses from the client
    let courses = requestCourses || [];

    // Update the course exclusion status
    const updatedCourses = courses.map(course => {
      if (course.id === courseId) {
        return { ...course, excluded };
      }
      return course;
    });

    // Recalculate GPA
    let totalPoints = 0;
    let totalCredits = 0;

    updatedCourses.forEach(course => {
      if (!course.excluded) {
        totalPoints += course.gradePoints * course.credits;
        totalCredits += course.credits;
      }
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
    console.log(`[Canvas API] Recalculated GPA: ${gpa}`);

    // Update the integration with the new GPA only
    // Note: We don't store courses in the database - they're kept in localStorage
    const { data, error } = await supabase
      .from("user_canvas_integrations")
      .update({
        gpa,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select();

    if (error) {
      console.error("[Canvas API] Error updating course exclusion:", error);
      return NextResponse.json(
        { error: "Failed to update course exclusion" },
        { status: 500 }
      );
    }

    console.log(`[Canvas API] Successfully updated course exclusion`);
    console.log(`[Canvas API] Returning ${updatedCourses.length} courses after toggle`);
    console.log(`[Canvas API] First course after toggle: ${JSON.stringify(updatedCourses[0])}`);

    return NextResponse.json({
      success: true,
      message: "Course exclusion updated",
      gpa,
      courses: updatedCourses,
    });
  } catch (error) {
    console.error("[Canvas API] Error toggling course exclusion:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

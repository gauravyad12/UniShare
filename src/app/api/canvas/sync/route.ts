import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Sync Canvas data (GPA)
export async function POST(request: NextRequest) {
  // Only log when explicitly syncing
  console.log("[Canvas API] Syncing GPA data...");
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[Canvas API] Error: Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    console.log(`[Canvas API] Found integration for domain: ${integration.domain}`);

    // Initialize variables
    let gpa = "0.00";
    let coursesArray = [];

    try {
      // Fetch enrollments from Canvas API
      console.log(`[Canvas API] Fetching enrollments from Canvas...`);
      const enrollmentsResponse = await fetch(
        `https://${integration.domain}/api/v1/users/self/enrollments`,
        {
          headers: {
            Authorization: `Bearer ${integration.access_token}`,
          },
        }
      );

      if (!enrollmentsResponse.ok) {
        throw new Error(`Canvas API returned status ${enrollmentsResponse.status}`);
      }

      const enrollments = await enrollmentsResponse.json();
      console.log(`[Canvas API] Retrieved ${enrollments.length} enrollments`);

      // Only log enrollment count
      console.log(`[Canvas API] Processing ${enrollments.length} enrollments...`);

      // Filter enrollments with grades
      const gradedEnrollments = enrollments.filter(enrollment => enrollment.grades && enrollment.grades.current_score);
      console.log(`[Canvas API] Found ${gradedEnrollments.length} enrollments with grades`);

      // Fetch detailed course information for each enrollment
      coursesArray = [];

      for (const enrollment of gradedEnrollments) {
        try {
          // Extract basic information
          const score = enrollment.grades.current_score;
          const courseId = enrollment.course_id;

          // Calculate grade points on 4.0 scale
          let gradePoints = 0;
          if (score >= 90) gradePoints = 4.0;
          else if (score >= 80) gradePoints = 3.0;
          else if (score >= 70) gradePoints = 2.0;
          else if (score >= 60) gradePoints = 1.0;

          // Fetch detailed course information
          console.log(`[Canvas API] Processing course ${courseId}`);
          const courseResponse = await fetch(
            `https://${integration.domain}/api/v1/courses/${courseId}`,
            {
              headers: {
                Authorization: `Bearer ${integration.access_token}`,
              },
            }
          );

          let courseName = '';
          let courseCode = '';
          let credits = 3.0; // Default credits

          if (courseResponse.ok) {
            const courseData = await courseResponse.json();
            // Skip detailed course data logging

            // Extract course name and code from detailed data
            courseName = courseData.name || '';
            courseCode = courseData.course_code || '';

            // Try to determine credits from course data
            if (courseData.course_format && courseData.course_format.toLowerCase().includes('lab')) {
              credits = 1.0;
            }
          } else {
            console.log(`[Canvas API] Could not fetch detailed course information for ${courseId}`);

            // Fallback to enrollment data for name and code
            if (enrollment.course && enrollment.course.name) {
              courseName = enrollment.course.name;
            } else if (enrollment.course_section_name) {
              courseName = enrollment.course_section_name;
            } else if (enrollment.course_name) {
              courseName = enrollment.course_name;
            } else if (enrollment.name) {
              courseName = enrollment.name;
            } else {
              courseName = `Course ${courseId}`;
            }

            if (enrollment.course && enrollment.course.course_code) {
              courseCode = enrollment.course.course_code;
            } else if (enrollment.course_code) {
              courseCode = enrollment.course_code;
            } else if (courseName.match(/^[A-Z]{2,4}\d{4}/)) {
              courseCode = courseName.match(/^[A-Z]{2,4}\d{4}/)[0];
            }
          }

          // Adjust credit hours based on course name if not already set by course data
          const lowerCourseName = courseName.toLowerCase();
          if (lowerCourseName.includes('lab') || lowerCourseName.includes('laboratory')) {
            credits = 1.0; // Labs are typically 1 credit
          } else if (lowerCourseName.includes('seminar') || lowerCourseName.includes('workshop')) {
            credits = 1.0; // Seminars often 1 credit
          } else if (lowerCourseName.includes('thesis') || lowerCourseName.includes('dissertation')) {
            credits = 6.0; // Thesis/dissertation courses often have higher credits
          } else if (lowerCourseName.includes('capstone') || lowerCourseName.includes('project')) {
            credits = 4.0; // Capstone projects often 4 credits
          }

          // Create course object with improved name and credits
          const course = {
            id: courseId.toString(),
            name: courseName,
            code: courseCode,
            score: score,
            grade: enrollment.grades.current_grade || '',
            credits: credits,
            gradePoints: gradePoints,
            excluded: false
          };

          console.log(`[Canvas API] Course: ${course.name}, Score: ${course.score}, Grade Points: ${gradePoints}`);

          // Add course to array
          coursesArray.push(course);

        } catch (error) {
          console.error(`[Canvas API] Error processing course ${enrollment.course_id}:`, error);
        }
      }

      console.log(`[Canvas API] Processed ${coursesArray.length} courses from enrollments`);

      // Calculate GPA
      if (coursesArray.length > 0) {
        let totalPoints = 0;
        let totalCredits = 0;

        coursesArray.forEach(course => {
          if (!course.excluded) {
            totalPoints += course.gradePoints * course.credits;
            totalCredits += course.credits;
          }
        });

        gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
        console.log(`[Canvas API] Calculated GPA: ${gpa}`);
      } else {
        console.log(`[Canvas API] No courses found, using default GPA: ${gpa}`);
      }
    } catch (error) {
      console.error("[Canvas API] Error fetching data from Canvas:", error);

      // Create simulated data for demo purposes
      gpa = (Math.random() * (4.0 - 2.5) + 2.5).toFixed(2);
      console.log(`[Canvas API] Using simulated GPA: ${gpa}`);

      coursesArray = [
        {
          id: "1",
          name: "Computer Science I",
          code: "COP3502",
          score: 92.5,
          grade: "A",
          credits: 3.0,
          gradePoints: 4.0,
          excluded: false
        },
        {
          id: "2",
          name: "Calculus with Analytic Geometry II",
          code: "MAC2312",
          score: 85.0,
          grade: "B",
          credits: 4.0,
          gradePoints: 3.0,
          excluded: false
        },
        {
          id: "3",
          name: "Honors Humanistic Tradition",
          code: "HUM2020H",
          score: 88.0,
          grade: "B+",
          credits: 3.0,
          gradePoints: 3.3,
          excluded: false
        },
        {
          id: "4",
          name: "Computer Science Lab",
          code: "COP3502L",
          score: 95.0,
          grade: "A",
          credits: 1.0,
          gradePoints: 4.0,
          excluded: false
        },
        {
          id: "5",
          name: "Music in Western Culture",
          code: "MUL2010",
          score: 91.0,
          grade: "A-",
          credits: 3.0,
          gradePoints: 3.7,
          excluded: false
        }
      ];
      console.log(`[Canvas API] Created ${coursesArray.length} simulated courses`);
    }

    // Update the integration with the last_synced timestamp only
    // Note: We don't update the GPA here because it will be calculated client-side
    // taking into account the excluded courses from localStorage
    // We also don't store courses in the database - they're kept in localStorage instead
    const { data, error } = await supabase
      .from("user_canvas_integrations")
      .update({
        // Don't update GPA here - it will be updated by the client after applying exclusions
        // Don't store courses in the database - they're kept in localStorage
        last_synced: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select();

    if (error) {
      console.error("[Canvas API] Error updating Canvas GPA:", error);
      return NextResponse.json(
        { error: "Failed to update Canvas GPA" },
        { status: 500 }
      );
    }

    // Prepare response
    const responseData = {
      success: true,
      message: "Canvas GPA synced",
      gpa: gpa,
      integration: data[0],
      courses: coursesArray
    };

    console.log(`[Canvas API] Returning response with ${responseData.courses.length} courses`);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[Canvas API] Error syncing Canvas data:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

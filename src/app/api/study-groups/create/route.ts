import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.json();
    console.log('Received form data:', formData);

    // Extract fields, supporting both snake_case and camelCase
    const name = formData.name;
    const description = formData.description || '';
    const course_code = formData.course_code || formData.courseCode || null;
    const max_members = formData.max_members || formData.maxMembers;
    const is_private = formData.is_private !== undefined ? formData.is_private : formData.isPrivate;
    const university_id = formData.university_id || formData.universityId;

    // Character limits
    const charLimits = {
      name: 50,
      description: 500,
      course_code: 20,
    };

    if (!name) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 },
      );
    }

    // Check character limits
    if (name.length > charLimits.name) {
      return NextResponse.json(
        { error: `Group name must be ${charLimits.name} characters or less` },
        { status: 400 },
      );
    }

    if (description && description.length > charLimits.description) {
      return NextResponse.json(
        { error: `Description must be ${charLimits.description} characters or less` },
        { status: 400 },
      );
    }

    if (course_code && course_code.length > charLimits.course_code) {
      return NextResponse.json(
        { error: `Course code must be ${charLimits.course_code} characters or less` },
        { status: 400 },
      );
    }

    // Check for bad words in text fields
    const { containsBadWords } = await import('@/utils/badWords');

    // Check name
    if (await containsBadWords(name)) {
      return NextResponse.json(
        { error: "Group name contains inappropriate language" },
        { status: 400 },
      );
    }

    // Check description
    if (description && await containsBadWords(description)) {
      return NextResponse.json(
        { error: "Description contains inappropriate language" },
        { status: 400 },
      );
    }

    // Check course code
    if (course_code && await containsBadWords(course_code)) {
      return NextResponse.json(
        { error: "Course code contains inappropriate language" },
        { status: 400 },
      );
    }

    // Get user profile if university_id is not provided
    let userUniversityId = university_id;
    let userName = null;

    if (!userUniversityId) {
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("university_id, full_name, username")
        .eq("id", user.id)
        .single();

      if (!userProfile?.university_id) {
        return NextResponse.json(
          { error: "User profile or university not found" },
          { status: 400 },
        );
      }

      userUniversityId = userProfile.university_id;
      userName = userProfile.full_name || userProfile.username || user.email;
    } else {
      // Get user name if university_id is provided
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("full_name, username")
        .eq("id", user.id)
        .single();

      userName = userProfile?.full_name || userProfile?.username || user.email;
    }

    // Create study group using a direct SQL query
    const studyGroupData = {
      name,
      description,
      course_code,
      max_members: max_members || null,
      is_private: is_private === true,
      created_by: user.id,
      university_id: userUniversityId,
      created_at: new Date().toISOString(),
    };

    console.log('Creating study group with data:', studyGroupData);

    // Use the stored procedure to create the study group and add the creator as a member
    const { data, error } = await supabase
      .rpc('create_study_group', {
        p_name: name,
        p_description: description || '',
        p_course_code: course_code,
        p_max_members: max_members || null,
        p_is_private: is_private === true,
        p_created_by: user.id,
        p_university_id: userUniversityId
      });

    // Parse the JSON response from the stored procedure
    const studyGroup = data;

    if (error) {
      console.error("Error creating study group:", error);
      return NextResponse.json(
        { error: "Failed to create study group" },
        { status: 500 },
      );
    }

    // Skip adding the creator as a member for now
    // We'll handle this on the client side after redirect
    console.log("Study group created successfully, skipping member creation for now");

    return NextResponse.json({ success: true, studyGroup });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

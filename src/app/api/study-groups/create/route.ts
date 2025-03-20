import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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
    const { name, description, course_code, max_members, is_private } =
      formData;

    if (!name) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 },
      );
    }

    // Get user profile to get university_id
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

    // Create study group
    const { data: studyGroup, error } = await supabase
      .from("study_groups")
      .insert({
        name,
        description,
        course_code,
        max_members: max_members || null,
        is_private: is_private || false,
        creator_id: user.id,
        creator_name:
          userProfile.full_name || userProfile.username || user.email,
        university_id: userProfile.university_id,
        created_at: new Date().toISOString(),
        member_count: 1, // Creator is the first member
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating study group:", error);
      return NextResponse.json(
        { error: "Failed to create study group" },
        { status: 500 },
      );
    }

    // Add creator as a member
    const { error: memberError } = await supabase
      .from("study_group_members")
      .insert({
        study_group_id: studyGroup.id,
        user_id: user.id,
        role: "admin",
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error("Error adding creator as member:", memberError);
      // Continue despite error - the group was created successfully
    }

    return NextResponse.json({ success: true, studyGroup });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

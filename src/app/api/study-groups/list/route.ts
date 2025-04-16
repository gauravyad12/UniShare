import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's university
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("university_id")
      .eq("id", user.id)
      .single();

    // Get public study groups for user's university
    console.log('API: Fetching public study groups for university:', userProfile?.university_id);
    
    // Use a direct SQL query to avoid RLS recursion issues
    const { data: studyGroups, error: studyGroupsError } = await supabase
      .rpc('get_public_study_groups', {
        p_university_id: userProfile?.university_id
      });

    if (studyGroupsError) {
      console.error('API: Error fetching study groups:', studyGroupsError);
      return NextResponse.json({ error: studyGroupsError.message }, { status: 500 });
    } else {
      console.log('API: Found study groups:', studyGroups?.length || 0);
    }

    // Get user's study groups
    const { data: userStudyGroups } = await supabase
      .from("study_group_members")
      .select("study_group_id")
      .eq("user_id", user.id);

    const userGroupIds =
      userStudyGroups?.map((group) => group.study_group_id) || [];

    // Get full details of user's study groups
    const { data: myStudyGroups } = await supabase
      .from("study_groups")
      .select("*")
      .in("id", userGroupIds.length > 0 ? userGroupIds : ['00000000-0000-0000-0000-000000000000'])
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    return NextResponse.json({ studyGroups, userGroupIds, myStudyGroups });
  } catch (error) {
    console.error("API: Unexpected error fetching study groups:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

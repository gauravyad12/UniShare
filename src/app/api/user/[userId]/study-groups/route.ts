import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient();
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Simplified approach that works for both authenticated and unauthenticated users
    // This avoids the need for stored procedures and complex RLS policies

    // Step 1: Get groups created by the user
    const { data: createdGroups, error: createdError } = await supabase
      .from('study_groups')
      .select('*')
      .eq('created_by', userId)
      .eq('is_private', false)
      .order('created_at', { ascending: false });

    if (createdError) {
      console.error('Error fetching created groups:', createdError);
      return NextResponse.json(
        { error: "Failed to fetch study groups" },
        { status: 500 }
      );
    }

    // Step 2: Get groups the user is a member of
    // First get the IDs of groups the user is a member of
    const { data: memberships, error: membershipError } = await supabase
      .from('study_group_members')
      .select('study_group_id')
      .eq('user_id', userId);

    if (membershipError) {
      console.error('Error fetching memberships:', membershipError);
      // Continue with just the created groups
      return NextResponse.json({ studyGroups: createdGroups || [] });
    }

    // If user is not a member of any groups, just return the created groups
    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ studyGroups: createdGroups || [] });
    }

    // Get the group IDs
    const groupIds = memberships.map(m => m.study_group_id);

    // Get the groups
    const { data: memberGroups, error: groupsError } = await supabase
      .from('study_groups')
      .select('*')
      .in('id', groupIds)
      .eq('is_private', false)
      .order('created_at', { ascending: false });

    if (groupsError) {
      console.error('Error fetching member groups:', groupsError);
      // Continue with just the created groups
      return NextResponse.json({ studyGroups: createdGroups || [] });
    }

    // Combine both sets of groups and remove duplicates
    const allGroups = [...(createdGroups || [])];

    // Add member groups, avoiding duplicates
    if (memberGroups) {
      for (const group of memberGroups) {
        if (!allGroups.some(g => g.id === group.id)) {
          allGroups.push(group);
        }
      }
    }

    return NextResponse.json({ studyGroups: allGroups });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

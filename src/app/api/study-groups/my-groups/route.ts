import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  try {
    console.log('API: my-groups endpoint called');
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;

    // Pagination parameters
    const limit = parseInt(searchParams.get('limit') || '6', 10); // Number of items per page
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search') || '';

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('API: Unauthorized - no user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('API: User authenticated:', user.id);

    // First get the total count of groups the user is a member of
    console.log('API: Getting total count of user study groups');
    try {
      // Get all study groups to count them
      const { data: allGroups, error: countError } = await supabase
        .rpc('get_user_study_groups_bypass_rls', {
          p_user_id: user.id
        });

      if (countError) {
        console.error('API: Error getting total count:', countError);
        throw countError;
      }

      // Filter by search if provided
      let filteredGroups = allGroups || [];
      if (search && filteredGroups.length > 0) {
        const searchLower = search.toLowerCase();
        filteredGroups = filteredGroups.filter(group =>
          group.name?.toLowerCase().includes(searchLower) ||
          group.description?.toLowerCase().includes(searchLower) ||
          group.course_code?.toLowerCase().includes(searchLower)
        );
      }

      const totalCount = filteredGroups.length;

      // Apply pagination manually
      const myGroups = filteredGroups.slice(offset, offset + limit);

      if (!myGroups) {
        console.log('API: No study groups found for user');
        return NextResponse.json({ myGroups: [], totalCount: 0 });
      }

      console.log('API: Found user study groups:', myGroups.length);
      console.log('API: Total count:', totalCount);
      console.log('API: User study group IDs:', myGroups.map(g => g.id));

      return NextResponse.json({
        myGroups,
        totalCount
      });
    } catch (err) {
      console.error('API: Error in stored procedure approach:', err);

      // Fall back to a direct SQL query approach
      console.log('API: Trying direct SQL query approach');

      try {
        // Get user's memberships directly using SQL
        const { data: memberships } = await supabase.rpc('get_user_memberships', {
          p_user_id: user.id
        });

        if (!memberships || memberships.length === 0) {
          console.log('API: No memberships found');
          return NextResponse.json({ myGroups: [], totalCount: 0 });
        }

        console.log('API: Found memberships:', memberships.length);

        // Get the group IDs
        const groupIds = memberships.map(m => m.study_group_id);

        // Get all groups first to count and filter
        const { data: allGroups } = await supabase.rpc('get_groups_by_ids_bypass_rls', {
          p_group_ids: groupIds
        });

        if (!allGroups || allGroups.length === 0) {
          console.log('API: No groups found');
          return NextResponse.json({ myGroups: [], totalCount: 0 });
        }

        // Filter by search if provided
        let filteredGroups = allGroups;
        if (search && filteredGroups.length > 0) {
          const searchLower = search.toLowerCase();
          filteredGroups = filteredGroups.filter(group =>
            group.name?.toLowerCase().includes(searchLower) ||
            group.description?.toLowerCase().includes(searchLower) ||
            group.course_code?.toLowerCase().includes(searchLower)
          );
        }

        const totalCount = filteredGroups.length;

        // Apply pagination manually
        const myGroups = filteredGroups.slice(offset, offset + limit);

        console.log('API: Found groups:', myGroups.length, 'of', totalCount);
        return NextResponse.json({ myGroups, totalCount });
      } catch (sqlErr) {
        console.error('API: Error in SQL approach:', sqlErr);

        // Last resort: return empty results
        return NextResponse.json({ myGroups: [], totalCount: 0 });
      }
    }


  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

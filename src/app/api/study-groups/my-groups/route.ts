import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  try {
    console.log('API: my-groups endpoint called');
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('API: Unauthorized - no user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('API: User authenticated:', user.id);

    // Use the stored procedure that bypasses RLS to get all study groups the user is a member of
    console.log('API: Using stored procedure to bypass RLS');
    try {
      const { data: myGroups, error: procError } = await supabase
        .rpc('get_user_study_groups_bypass_rls', {
          p_user_id: user.id
        });

      if (procError) {
        console.error('API: Error calling stored procedure:', procError);
        throw procError;
      }

      if (!myGroups || myGroups.length === 0) {
        console.log('API: No study groups found for user');
        return NextResponse.json({ myGroups: [] });
      }

      console.log('API: Found user study groups:', myGroups.length);
      console.log('API: User study group IDs:', myGroups.map(g => g.id));
      console.log('API: Group names:', myGroups.map(g => g.name));
      console.log('API: Private groups:', myGroups.filter(g => g.is_private).length);
      console.log('API: Private group details:',
        myGroups.filter(g => g.is_private).map(g => ({ id: g.id, name: g.name }))
      );

      return NextResponse.json({ myGroups });
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
          return NextResponse.json({ myGroups: [] });
        }

        console.log('API: Found memberships:', memberships.length);

        // Get the group IDs
        const groupIds = memberships.map(m => m.study_group_id);

        // Get the groups
        const { data: groups } = await supabase.rpc('get_groups_by_ids_bypass_rls', {
          p_group_ids: groupIds
        });

        if (!groups || groups.length === 0) {
          console.log('API: No groups found');
          return NextResponse.json({ myGroups: [] });
        }

        console.log('API: Found groups:', groups.length);
        return NextResponse.json({ myGroups: groups });
      } catch (sqlErr) {
        console.error('API: Error in SQL approach:', sqlErr);

        // Last resort: try to get the groups one by one
        console.log('API: Trying one-by-one approach');
        return NextResponse.json({ myGroups: [] });
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

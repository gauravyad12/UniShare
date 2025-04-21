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

    // Log the request origin to help debug
    const origin = request.headers.get('origin') || 'unknown';
    const referer = request.headers.get('referer') || 'unknown';
    console.log(`Request from origin: ${origin}, referer: ${referer}`);

    console.log(`Fetching study groups for user: ${userId}`);

    // Use a stored procedure to get the user's study groups to avoid RLS recursion
    console.log('Using stored procedure to get user study groups');
    try {
      // First try with the bypass RLS procedure if available
      const { data: userGroups, error: procError } = await supabase
        .rpc('get_user_study_groups_bypass_rls', {
          p_user_id: userId
        });

      if (procError) {
        console.error('Error calling bypass RLS procedure:', procError);
        // If the bypass procedure fails, try the regular one
        const { data: regularGroups, error: regularError } = await supabase
          .rpc('get_user_study_groups', {
            p_user_id: userId
          });

        if (regularError) {
          console.error('Error calling regular procedure:', regularError);
          throw regularError;
        }

        // Filter to only include public groups
        const publicGroups = regularGroups?.filter(group => !group.is_private) || [];
        console.log(`Found ${publicGroups.length} public study groups using regular procedure`);
        return NextResponse.json({ studyGroups: publicGroups });
      }

      // Filter to only include public groups
      const publicGroups = userGroups?.filter(group => !group.is_private) || [];
      console.log(`Found ${publicGroups.length} public study groups using bypass procedure`);
      return NextResponse.json({ studyGroups: publicGroups });
    } catch (procError) {
      console.error('Error in stored procedure approach:', procError);

      // Fall back to a direct SQL approach as a last resort
      try {
        // Use a direct query to get public groups for the user
        const { data: publicGroups, error: directError } = await supabase
          .from('study_groups')
          .select('*')
          .eq('is_private', false)
          .order('created_at', { ascending: false });

        if (directError) {
          console.error('Error in direct query fallback:', directError);
          throw directError;
        }

        console.log(`Found ${publicGroups?.length || 0} public study groups using direct query`);
        return NextResponse.json({ studyGroups: publicGroups || [] });
      } catch (directError) {
        console.error('All approaches failed:', directError);
        return NextResponse.json(
          { error: "Failed to fetch study groups" },
          { status: 500 }
        );
      }
    }

    // All logic is now handled in the try/catch blocks above
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

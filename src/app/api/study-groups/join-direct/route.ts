import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    console.log(`Attempting direct join for group ${groupId} and user ${user.id}`);

    // First check if the user is already a member to avoid unique constraint errors
    const { data: existingMember, error: checkError } = await supabase
      .from('study_group_members')
      .select('id')
      .eq('study_group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing membership:", checkError);
      // Continue anyway, we'll handle unique constraint errors below
    }

    if (existingMember) {
      console.log("User is already a member of this group");
      return NextResponse.json({ alreadyMember: true });
    }

    // Use a direct insert to add the member
    const { data, error } = await supabase.from('study_group_members').insert({
      study_group_id: groupId,
      user_id: user.id,
      role: 'member',
      joined_at: new Date().toISOString()
    });

    if (error) {
      console.error("Error in direct join:", error);

      // If there's an RLS error, try using the stored procedure
      if (error.message && error.message.includes("policy")) {
        console.log("RLS policy error detected, trying stored procedure");

        // Try to use the stored procedure
        try {
          const { data: procResult, error: procError } = await supabase.rpc(
            'join_study_group_direct',
            {
              p_group_id: groupId,
              p_user_id: user.id
            }
          );

          if (procError) {
            console.error("Error using stored procedure:", procError);
            return NextResponse.json({ error: `Failed to join group: ${procError.message}` }, { status: 500 });
          }

          if (procResult === false) {
            // User is already a member (according to the stored procedure)
            return NextResponse.json({ alreadyMember: true });
          }

          return NextResponse.json({ success: true });
        } catch (procException) {
          console.error("Exception using stored procedure:", procException);
          return NextResponse.json({ error: `Failed to join group: ${procException instanceof Error ? procException.message : 'Unknown error'}` }, { status: 500 });
        }
      }

      return NextResponse.json({ error: `Failed to join group: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in direct join:", error);
    return NextResponse.json({
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

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

    // Get the group ID from the request body
    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json(
        { error: "Study group ID is required" },
        { status: 400 }
      );
    }

    console.log(`Attempting to leave group ${groupId} for user ${user.id}`);

    // Use the stored procedure to leave the group
    const { data, error } = await supabase.rpc('leave_study_group', {
      p_group_id: groupId,
      p_user_id: user.id
    });

    if (error) {
      console.error("Error leaving group:", error);
      
      // Check if the error is because the user is the creator
      if (error.message.includes('creator cannot leave')) {
        return NextResponse.json(
          { error: "The creator cannot leave the group" },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to leave the group" },
        { status: 500 }
      );
    }

    // If data is false, the user wasn't a member
    if (data === false) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

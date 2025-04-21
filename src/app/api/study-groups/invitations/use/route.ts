import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


// POST: Use an invitation code to join a group
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Invitation code is required" }, { status: 400 });
    }

    // Call the stored procedure to use the invitation
    const { data, error } = await supabase.rpc('use_study_group_invitation', {
      p_code: code
    });

    if (error) {
      console.error("Error using invitation:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = data[0];

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: result.message,
      studyGroupId: result.study_group_id,
      studyGroupName: result.study_group_name
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

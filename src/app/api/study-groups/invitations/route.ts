import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


// POST: Create a new invitation
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studyGroupId, expiresInHours, maxUses } = await request.json();

    if (!studyGroupId) {
      return NextResponse.json({ error: "Study group ID is required" }, { status: 400 });
    }

    // Call the simpler stored procedure to create an invitation
    const { data, error } = await supabase.rpc('simple_create_invitation', {
      p_study_group_id: studyGroupId,
      p_expires_in_hours: expiresInHours || 24,
      p_max_uses: maxUses ? parseInt(maxUses) : null
    });

    if (error) {
      console.error("Error creating invitation:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invitation: data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

// GET: Get all invitations for a study group
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const studyGroupId = url.searchParams.get('studyGroupId');

    if (!studyGroupId) {
      return NextResponse.json({ error: "Study group ID is required" }, { status: 400 });
    }

    // Call the stored procedure to get invitations
    const { data, error } = await supabase.rpc('get_study_group_invitations', {
      p_study_group_id: studyGroupId
    });

    if (error) {
      console.error("Error fetching invitations:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invitations: data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

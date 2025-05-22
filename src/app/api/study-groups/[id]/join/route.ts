import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const groupId = params.id;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!groupId) {
      return NextResponse.json(
        { error: "Study group ID is required" },
        { status: 400 },
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("study_group_members")
      .select("*")
      .eq("study_group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this group" },
        { status: 400 },
      );
    }

    // Get study group to check if it's full
    const { data: studyGroup } = await supabase
      .from("study_groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (!studyGroup) {
      return NextResponse.json(
        { error: "Study group not found" },
        { status: 404 },
      );
    }

    if (
      studyGroup.max_members &&
      studyGroup.member_count >= studyGroup.max_members
    ) {
      return NextResponse.json(
        { error: "This study group is full" },
        { status: 400 },
      );
    }

    // Add user as a member
    const { error: memberError } = await supabase
      .from("study_group_members")
      .insert({
        study_group_id: groupId,
        user_id: user.id,
        role: "member",
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error("Error adding member:", memberError);
      return NextResponse.json(
        { error: "Failed to join study group" },
        { status: 500 },
      );
    }

    // Also manually update the member count to ensure it's updated correctly
    try {
      const { error: updateError } = await supabase
        .from("study_groups")
        .update({
          member_count: (studyGroup.member_count || 0) + 1
        })
        .eq("id", groupId);

      if (updateError) {
        console.error("Error manually updating member count:", updateError);
      }
    } catch (updateError) {
      console.error("Error manually updating member count:", updateError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

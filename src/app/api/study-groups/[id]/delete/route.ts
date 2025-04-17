import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const adminClient = createAdminClient();
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
        { status: 400 }
      );
    }

    // Check if user is the creator or an admin of the group
    const { data: studyGroup } = await adminClient
      .from("study_groups")
      .select("created_by")
      .eq("id", groupId)
      .single();

    if (!studyGroup) {
      return NextResponse.json(
        { error: "Study group not found" },
        { status: 404 }
      );
    }

    const isCreator = studyGroup.created_by === user.id;

    if (!isCreator) {
      // Check if user is an admin
      const { data: membership } = await adminClient
        .from("study_group_members")
        .select("role")
        .eq("study_group_id", groupId)
        .eq("user_id", user.id)
        .single();

      const isAdmin = membership?.role === "admin";

      if (!isAdmin) {
        return NextResponse.json(
          { error: "Only the creator or admins can delete this study group" },
          { status: 403 }
        );
      }
    }

    // Delete all related data first (using cascading delete would be better, but we'll do it manually for safety)
    
    // 1. Delete all messages
    await adminClient
      .from("group_chat_messages")
      .delete()
      .eq("study_group_id", groupId);

    // 2. Delete all message read statuses
    await adminClient
      .from("group_chat_read_status")
      .delete()
      .eq("study_group_id", groupId);

    // 3. Delete all resources
    await adminClient
      .from("study_group_resources")
      .delete()
      .eq("study_group_id", groupId);

    // 4. Delete all members
    await adminClient
      .from("study_group_members")
      .delete()
      .eq("study_group_id", groupId);

    // 5. Finally, delete the study group
    const { error: deleteError } = await adminClient
      .from("study_groups")
      .delete()
      .eq("id", groupId);

    if (deleteError) {
      console.error("Error deleting study group:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete study group" },
        { status: 500 }
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

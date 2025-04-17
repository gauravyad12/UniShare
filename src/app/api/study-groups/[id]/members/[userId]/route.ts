import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// PATCH to update a member's role (promote/demote)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const supabase = createClient();
    const adminClient = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const groupId = params.id;
    const targetUserId = params.userId;
    const { role } = await request.json();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!groupId || !targetUserId) {
      return NextResponse.json(
        { error: "Study group ID and user ID are required" },
        { status: 400 }
      );
    }

    if (!role || !["admin", "member"].includes(role)) {
      return NextResponse.json(
        { error: "Valid role (admin or member) is required" },
        { status: 400 }
      );
    }

    // Check if the current user is the creator or an admin
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
          { error: "Only the creator or admins can manage members" },
          { status: 403 }
        );
      }
    }

    // Don't allow changing the role of the creator
    if (targetUserId === studyGroup.created_by && role !== "admin") {
      return NextResponse.json(
        { error: "Cannot change the role of the group creator" },
        { status: 400 }
      );
    }

    // Update the member's role
    const { error: updateError } = await adminClient
      .from("study_group_members")
      .update({ role })
      .eq("study_group_id", groupId)
      .eq("user_id", targetUserId);

    if (updateError) {
      console.error("Error updating member role:", updateError);
      return NextResponse.json(
        { error: "Failed to update member role" },
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

// DELETE to remove a member from the group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const supabase = createClient();
    const adminClient = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const groupId = params.id;
    const targetUserId = params.userId;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!groupId || !targetUserId) {
      return NextResponse.json(
        { error: "Study group ID and user ID are required" },
        { status: 400 }
      );
    }

    // Check if the current user is the creator or an admin
    const { data: studyGroup } = await adminClient
      .from("study_groups")
      .select("created_by, member_count")
      .eq("id", groupId)
      .single();

    if (!studyGroup) {
      return NextResponse.json(
        { error: "Study group not found" },
        { status: 404 }
      );
    }

    // Don't allow removing the creator
    if (targetUserId === studyGroup.created_by) {
      return NextResponse.json(
        { error: "Cannot remove the group creator" },
        { status: 400 }
      );
    }

    const isCreator = studyGroup.created_by === user.id;
    let isAdmin = false;

    if (!isCreator) {
      // Check if user is an admin
      const { data: membership } = await adminClient
        .from("study_group_members")
        .select("role")
        .eq("study_group_id", groupId)
        .eq("user_id", user.id)
        .single();

      isAdmin = membership?.role === "admin";

      if (!isAdmin && targetUserId !== user.id) {
        return NextResponse.json(
          { error: "Only the creator, admins, or the member themselves can remove a member" },
          { status: 403 }
        );
      }
    }

    // Check if the target user is an admin and the current user is not the creator
    if (!isCreator) {
      const { data: targetMembership } = await adminClient
        .from("study_group_members")
        .select("role")
        .eq("study_group_id", groupId)
        .eq("user_id", targetUserId)
        .single();

      if (targetMembership?.role === "admin" && !isCreator) {
        return NextResponse.json(
          { error: "Only the creator can remove an admin" },
          { status: 403 }
        );
      }
    }

    // Remove the member
    const { error: deleteError } = await adminClient
      .from("study_group_members")
      .delete()
      .eq("study_group_id", groupId)
      .eq("user_id", targetUserId);

    if (deleteError) {
      console.error("Error removing member:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    // Update member count
    const { error: updateError } = await adminClient
      .from("study_groups")
      .update({
        member_count: Math.max((studyGroup.member_count || 1) - 1, 0),
      })
      .eq("id", groupId);

    if (updateError) {
      console.error("Error updating member count:", updateError);
      // Continue despite error - the member was removed successfully
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

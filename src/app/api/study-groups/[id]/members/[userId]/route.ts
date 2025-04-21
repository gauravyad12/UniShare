import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


// PATCH to update a member's role (promote/demote)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const supabase = createClient();
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

    console.log('Using stored procedure to update member role');
    console.log('Group ID:', groupId);
    console.log('Admin ID:', user.id);
    console.log('Target User ID:', targetUserId);
    console.log('New Role:', role);

    // Use the stored procedure to update the member's role
    const { data, error } = await supabase.rpc('manage_study_group_member', {
      p_group_id: groupId,
      p_admin_id: user.id,
      p_target_user_id: targetUserId,
      p_action: 'update_role',
      p_new_role: role
    });

    if (error) {
      console.error('Error updating member role:', error);

      // Check for specific error messages
      if (error.message.includes('Only the creator or admins')) {
        return NextResponse.json(
          { error: "Only the creator or admins can update member roles" },
          { status: 403 }
        );
      } else if (error.message.includes('Cannot change the role')) {
        return NextResponse.json(
          { error: "Cannot change the role of the group creator" },
          { status: 400 }
        );
      } else if (error.message.includes('Study group not found')) {
        return NextResponse.json(
          { error: "Study group not found" },
          { status: 404 }
        );
      } else if (error.message.includes('Target user is not a member')) {
        return NextResponse.json(
          { error: "User is not a member of this study group" },
          { status: 404 }
        );
      }

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

    console.log('Using stored procedure to remove member');
    console.log('Group ID:', groupId);
    console.log('Admin ID:', user.id);
    console.log('Target User ID:', targetUserId);

    // Use the stored procedure to remove the member
    const { data, error } = await supabase.rpc('manage_study_group_member', {
      p_group_id: groupId,
      p_admin_id: user.id,
      p_target_user_id: targetUserId,
      p_action: 'remove'
    });

    if (error) {
      console.error('Error removing member:', error);

      // Check for specific error messages
      if (error.message.includes('Only the creator, admins, or the member')) {
        return NextResponse.json(
          { error: "Only the creator, admins, or the member themselves can remove a member" },
          { status: 403 }
        );
      } else if (error.message.includes('Cannot remove the creator')) {
        return NextResponse.json(
          { error: "Cannot remove the group creator" },
          { status: 400 }
        );
      } else if (error.message.includes('Study group not found')) {
        return NextResponse.json(
          { error: "Study group not found" },
          { status: 404 }
        );
      } else if (error.message.includes('Target user is not a member')) {
        return NextResponse.json(
          { error: "User is not a member of this study group" },
          { status: 404 }
        );
      } else if (error.message.includes('Admins cannot remove other admins') || error.message.includes('Only the creator can remove an admin')) {
        return NextResponse.json(
          { error: "Only the creator can remove an admin" },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: "Failed to remove member" },
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

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// DELETE a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const groupId = params.id;
    const messageId = params.messageId;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!groupId || !messageId) {
      return NextResponse.json(
        { error: "Study group ID and message ID are required" },
        { status: 400 }
      );
    }

    // Check if the message exists and belongs to the user
    const { data: message, error: messageError } = await supabase
      .from("group_chat_messages")
      .select("*")
      .eq("id", messageId)
      .eq("study_group_id", groupId)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Check if user is the sender or an admin of the group
    if (message.sender_id !== user.id) {
      // Check if user is an admin
      const { data: membership, error: membershipError } = await supabase
        .from("study_group_members")
        .select("role")
        .eq("study_group_id", groupId)
        .eq("user_id", user.id)
        .single();

      if (membershipError || !membership || membership.role !== "admin") {
        return NextResponse.json(
          { error: "You don't have permission to delete this message" },
          { status: 403 }
        );
      }
    }

    // Delete the message
    const { error: deleteError } = await supabase
      .from("group_chat_messages")
      .delete()
      .eq("id", messageId);

    if (deleteError) {
      console.error("Error deleting message:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete message" },
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

// PATCH to update a message (e.g., pin/unpin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const groupId = params.id;
    const messageId = params.messageId;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!groupId || !messageId) {
      return NextResponse.json(
        { error: "Study group ID and message ID are required" },
        { status: 400 }
      );
    }

    // Get the update data from the request body
    const { is_pinned } = await request.json();

    if (typeof is_pinned !== "boolean") {
      return NextResponse.json(
        { error: "Invalid update data" },
        { status: 400 }
      );
    }

    // Check if user is an admin of the group
    const { data: membership, error: membershipError } = await supabase
      .from("study_group_members")
      .select("role")
      .eq("study_group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only group admins can pin messages" },
        { status: 403 }
      );
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await supabase
      .from("group_chat_messages")
      .update({ is_pinned })
      .eq("id", messageId)
      .eq("study_group_id", groupId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating message:", updateError);
      return NextResponse.json(
        { error: "Failed to update message" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: updatedMessage
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

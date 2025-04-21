import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


// GET a single message with profile information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const supabase = createClient();
    const adminClient = createAdminClient();
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

    // Check if user is a member of the study group using stored procedure
    let membership = null;
    let membershipError = null;

    if (adminClient) {
      // Try with admin client first
      const result = await adminClient
        .from("study_group_members")
        .select("*")
        .eq("study_group_id", groupId)
        .eq("user_id", user.id)
        .single();

      membership = result.data;
      membershipError = result.error;
    }

    // If admin client failed or is not available, use stored procedure
    if (!adminClient || membershipError) {
      console.log('Using stored procedure to check membership');
      const { data, error } = await supabase.rpc('check_study_group_membership', {
        p_group_id: groupId,
        p_user_id: user.id
      });

      if (error) {
        console.error('Error checking membership with stored procedure:', error);
        membershipError = error;
      } else if (data && data.length > 0 && data[0].is_member) {
        membership = { role: data[0].role };
        membershipError = null;
      }
    }

    if (membershipError) {
      console.error("Error checking membership:", membershipError);
      return NextResponse.json(
        { error: "Failed to verify study group membership" },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this study group" },
        { status: 403 }
      );
    }

    // Get the message using admin client or regular client
    let message = null;
    let messageError = null;

    if (adminClient) {
      // Try with admin client first
      const result = await adminClient
        .from("group_chat_messages")
        .select("*")
        .eq("id", messageId)
        .eq("study_group_id", groupId)
        .single();

      message = result.data;
      messageError = result.error;
    }

    // If admin client failed or is not available, use regular client
    if (!adminClient || messageError) {
      console.log('Using regular client to get message');
      const { data, error } = await supabase
        .from("group_chat_messages")
        .select("*")
        .eq("id", messageId)
        .eq("study_group_id", groupId)
        .single();

      message = data;
      messageError = error;
    }

    if (messageError || !message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Get the sender's profile information
    let profile = null;
    let profileError = null;

    if (adminClient) {
      // Try with admin client first
      const result = await adminClient
        .from("user_profiles")
        .select("full_name, username, avatar_url")
        .eq("id", message.sender_id)
        .single();

      profile = result.data;
      profileError = result.error;
    }

    // If admin client failed or is not available, use regular client
    if (!adminClient || profileError) {
      console.log('Using regular client to get profile');
      const { data, error } = await supabase
        .from("user_profiles")
        .select("full_name, username, avatar_url")
        .eq("id", message.sender_id)
        .single();

      profile = data;
      profileError = error;
    }

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      // Continue without profile info
    }

    // Combine message with profile information
    const messageWithProfile = {
      ...message,
      full_name: profile?.full_name,
      username: profile?.username,
      avatar_url: profile?.avatar_url
    };

    return NextResponse.json({
      message: messageWithProfile
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// DELETE a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const supabase = createClient();
    const adminClient = createAdminClient();
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

    // Check if the message exists and belongs to the user using admin client
    const { data: message, error: messageError } = await adminClient
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
      // Check if user is an admin using admin client to bypass RLS
      const { data: membership, error: membershipError } = await adminClient
        .from("study_group_members")
        .select("role")
        .eq("study_group_id", groupId)
        .eq("user_id", user.id)
        .single();

      const isAdmin = membership?.role === "admin";

      if (membershipError) {
        console.error("Error checking admin status:", membershipError);
        return NextResponse.json(
          { error: "Failed to verify admin status" },
          { status: 500 }
        );
      }

      if (!isAdmin) {
        return NextResponse.json(
          { error: "You don't have permission to delete this message" },
          { status: 403 }
        );
      }
    }

    // Delete the message using admin client
    const { error: deleteError } = await adminClient
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
    const adminClient = createAdminClient();
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

    // Check if user is an admin using admin client to bypass RLS
    const { data: membership, error: membershipError } = await adminClient
      .from("study_group_members")
      .select("role")
      .eq("study_group_id", groupId)
      .eq("user_id", user.id)
      .single();

    const isAdmin = membership?.role === "admin";

    if (membershipError) {
      console.error("Error checking admin status:", membershipError);
      return NextResponse.json(
        { error: "Failed to verify admin status" },
        { status: 500 }
      );
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only group admins can pin messages" },
        { status: 403 }
      );
    }

    // Update the message using admin client
    const { data: updatedMessage, error: updateError } = await adminClient
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

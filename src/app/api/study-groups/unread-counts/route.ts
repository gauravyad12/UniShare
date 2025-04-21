import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


// GET unread message counts for all study groups the user is a member of
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all study groups the user is a member of
    const { data: memberships, error: membershipError } = await supabase
      .from("study_group_members")
      .select("study_group_id")
      .eq("user_id", user.id);

    if (membershipError) {
      console.error("Error fetching memberships:", membershipError);
      return NextResponse.json(
        { error: "Failed to fetch study group memberships" },
        { status: 500 }
      );
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ unreadCounts: {} });
    }

    const groupIds = memberships.map(m => m.study_group_id);

    // For each group, get the total message count and the count of messages read by the user
    const unreadCounts = {};

    // Get all messages for these groups
    const { data: allMessages, error: messagesError } = await supabase
      .from("group_chat_messages")
      .select("id, study_group_id")
      .in("study_group_id", groupIds);

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    // Get all read statuses for the user
    const { data: readStatuses, error: readStatusError } = await supabase
      .from("message_read_status")
      .select("message_id")
      .eq("user_id", user.id);

    if (readStatusError) {
      console.error("Error fetching read statuses:", readStatusError);
      return NextResponse.json(
        { error: "Failed to fetch read statuses" },
        { status: 500 }
      );
    }

    // Create a set of read message IDs for faster lookup
    const readMessageIds = new Set(readStatuses?.map(status => status.message_id) || []);

    // Group messages by study group and count unread messages
    const messagesByGroup = {};
    allMessages?.forEach(message => {
      if (!messagesByGroup[message.study_group_id]) {
        messagesByGroup[message.study_group_id] = {
          total: 0,
          unread: 0
        };
      }
      
      messagesByGroup[message.study_group_id].total++;
      
      if (!readMessageIds.has(message.id)) {
        messagesByGroup[message.study_group_id].unread++;
      }
    });

    return NextResponse.json({
      unreadCounts: messagesByGroup
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

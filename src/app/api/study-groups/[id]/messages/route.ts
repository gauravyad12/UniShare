import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET messages for a study group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
        { status: 400 }
      );
    }

    // Check if user is a member of the study group
    const { data: membership, error: membershipError } = await supabase
      .from("study_group_members")
      .select("*")
      .eq("study_group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "You are not a member of this study group" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const before = searchParams.get("before");
    const after = searchParams.get("after");

    // Build query
    let query = supabase
      .from("group_chat_messages_with_profiles")
      .select("*")
      .eq("study_group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Add pagination
    if (before) {
      query = query.lt("created_at", before);
    } else if (after) {
      query = query.gt("created_at", after);
      query = query.order("created_at", { ascending: true });
    }

    // Execute query
    const { data: messages, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    // If we queried with 'after', reverse the results to maintain descending order
    const sortedMessages = after
      ? [...messages].reverse()
      : messages;

    // Mark messages as read
    if (sortedMessages.length > 0) {
      // Get all message IDs that aren't already marked as read by this user
      const messageIds = sortedMessages.map(message => message.id);

      // Check which messages are already read
      const { data: existingReadStatus } = await supabase
        .from("message_read_status")
        .select("message_id")
        .eq("user_id", user.id)
        .in("message_id", messageIds);

      const readMessageIds = existingReadStatus?.map(status => status.message_id) || [];
      const unreadMessageIds = messageIds.filter(id => !readMessageIds.includes(id));

      // Mark unread messages as read
      if (unreadMessageIds.length > 0) {
        const readStatusRecords = unreadMessageIds.map(messageId => ({
          message_id: messageId,
          user_id: user.id,
          read_at: new Date().toISOString()
        }));

        await supabase.from("message_read_status").insert(readStatusRecords);
      }
    }

    // Get the total count of messages in this group
    const { count, error: countError } = await supabase
      .from("group_chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("study_group_id", groupId);

    if (countError) {
      console.error("Error counting messages:", countError);
    }

    return NextResponse.json({
      messages: sortedMessages,
      count: count || 0,
      hasMore: sortedMessages.length === limit
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// POST a new message to a study group
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
        { status: 400 }
      );
    }

    // Check if user is a member of the study group
    const { data: membership, error: membershipError } = await supabase
      .from("study_group_members")
      .select("*")
      .eq("study_group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "You are not a member of this study group" },
        { status: 403 }
      );
    }

    // Get the message content from the request body
    const { content } = await request.json();

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Check for bad words in message content
    const { containsBadWords } = await import('@/utils/badWords');

    if (await containsBadWords(content)) {
      return NextResponse.json(
        { error: "Message contains inappropriate language" },
        { status: 400 }
      );
    }

    // Insert the message
    const { data: message, error } = await supabase
      .from("group_chat_messages")
      .insert({
        study_group_id: groupId,
        sender_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating message:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    // Get the sender's profile information
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("full_name, username, avatar_url")
      .eq("id", user.id)
      .single();

    // Combine message with profile information
    const messageWithProfile = {
      ...message,
      full_name: profile?.full_name,
      username: profile?.username,
      avatar_url: profile?.avatar_url
    };

    return NextResponse.json({
      success: true,
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

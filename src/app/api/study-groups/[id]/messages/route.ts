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

    // We'll check membership in the stored procedure

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const before = searchParams.get("before");
    const after = searchParams.get("after");

    console.log('Using stored procedure to get messages');

    // Use the simplified stored procedure to get messages
    const { data: messages, error } = await supabase.rpc('get_messages_with_profiles', {
      p_group_id: groupId,
      p_user_id: user.id,
      p_limit: limit
    });

    if (error) {
      console.error("Error fetching messages with stored procedure:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    // If we queried with 'after', reverse the results to maintain descending order
    const sortedMessages = after && messages ? [...messages].reverse() : messages || [];

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

    // We'll check membership in the stored procedure
    console.log('Using stored procedure to check membership and get messages');
    console.log('Group ID:', groupId);
    console.log('User ID:', user.id);

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

    // Use the simplified stored procedure to send the message
    const { data: messageWithProfile, error } = await supabase.rpc('send_message_with_profile', {
      p_group_id: groupId,
      p_user_id: user.id,
      p_content: content.trim()
    });

    if (error) {
      console.error("Error sending message with stored procedure:", error);

      // Check if the error is because the user is not a member
      if (error.message.includes('not a member')) {
        return NextResponse.json(
          { error: "You are not a member of this study group" },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

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

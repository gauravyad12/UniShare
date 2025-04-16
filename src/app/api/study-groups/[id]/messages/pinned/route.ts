import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET pinned messages for a study group
export async function GET(
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

    // Check if user is a member of the study group using admin client to bypass RLS
    const { data: membership, error: membershipError } = await adminClient
      .from("study_group_members")
      .select("*")
      .eq("study_group_id", groupId)
      .eq("user_id", user.id)
      .single();

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

    // Get pinned messages using admin client to bypass RLS
    const { data: pinnedMessages, error } = await adminClient
      .from("group_chat_messages")
      .select("*")
      .eq("study_group_id", groupId)
      .eq("is_pinned", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pinned messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch pinned messages" },
        { status: 500 }
      );
    }

    // Get profile information for each message
    const messagesWithProfiles = [];
    if (pinnedMessages && pinnedMessages.length > 0) {
      // Get unique sender IDs
      const senderIds = [...new Set(pinnedMessages.map(msg => msg.sender_id))];

      // Fetch profiles for all senders in one query using admin client
      const { data: profiles } = await adminClient
        .from("user_profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", senderIds);

      // Create a map of profiles by ID for quick lookup
      const profileMap = {};
      if (profiles) {
        profiles.forEach(profile => {
          profileMap[profile.id] = profile;
        });
      }

      // Combine messages with profiles
      messagesWithProfiles.push(
        ...pinnedMessages.map(msg => ({
          ...msg,
          full_name: profileMap[msg.sender_id]?.full_name,
          username: profileMap[msg.sender_id]?.username,
          avatar_url: profileMap[msg.sender_id]?.avatar_url
        }))
      );
    }

    return NextResponse.json({
      pinnedMessages: messagesWithProfiles
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

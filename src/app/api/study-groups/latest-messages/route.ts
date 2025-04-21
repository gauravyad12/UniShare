import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use the stored procedure to get all study groups the user is a member of
    const { data: userGroups, error: groupsError } = await supabase
      .rpc('get_user_study_groups', {
        p_user_id: user.id
      });

    if (groupsError) {
      console.error("Error fetching user study groups:", groupsError);
      return NextResponse.json(
        { error: "Failed to fetch study groups" },
        { status: 500 }
      );
    }

    if (!userGroups || userGroups.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    // Get latest messages for all groups
    const groupsWithMessages = await Promise.all(userGroups.map(async (group) => {
      // Get latest message for the group using stored procedure to bypass RLS
      try {
        const { data: messageWithProfile, error: messageError } = await supabase
          .rpc('get_latest_message_with_profile', {
            p_group_id: group.id
          });

        if (messageError) {
          console.error(`Error fetching latest message for group ${group.id}:`, messageError);
          return {
            ...group,
            latestMessage: null
          };
        }

        // Check if the message has all required fields
        if (messageWithProfile) {
          console.log(`Message data for group ${group.id}:`, messageWithProfile);

          // Format the message to match what's used in the sidebar
          const safeMessage = {
            ...messageWithProfile,
            id: messageWithProfile.id || `temp-${Date.now()}`,
            sender_id: messageWithProfile.sender_id,
            sender_name: messageWithProfile.full_name || messageWithProfile.username || 'User',
            content: messageWithProfile.content || 'New message',
            created_at: messageWithProfile.created_at || new Date().toISOString(),
            avatar_url: messageWithProfile.avatar_url
          };

          return {
            ...group,
            latestMessage: safeMessage
          };
        }

        return {
          ...group,
          latestMessage: messageWithProfile || null
        };
      } catch (err) {
        console.error(`Error processing message for group ${group.id}:`, err);
        return {
          ...group,
          latestMessage: null
        };
      }

      // Return statement is handled in the try/catch block
    }));

    // Sort groups by latest message (most recent first)
    groupsWithMessages.sort((a, b) => {
      // If both have latest messages, sort by message time
      if (a.latestMessage && b.latestMessage) {
        return new Date(b.latestMessage.created_at).getTime() -
               new Date(a.latestMessage.created_at).getTime();
      }
      // If only one has a latest message, that one comes first
      if (a.latestMessage) return -1;
      if (b.latestMessage) return 1;
      // If neither has messages, sort by group creation date
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({ groups: groupsWithMessages });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

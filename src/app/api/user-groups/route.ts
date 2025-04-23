import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";


export async function GET(request: Request) {
  try {
    console.log('API: user-groups endpoint called');
    const supabase = createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('API: Unauthorized - no user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('API: User authenticated:', user.id);

    // Get URL parameters
    const url = new URL(request.url);
    const currentGroupId = url.searchParams.get('currentGroupId');

    // Use the stored procedure that bypasses RLS to get all study groups the user is a member of
    console.log('API: Using stored procedure to fetch user study groups');
    try {
      const { data: userGroups, error: procError } = await supabase
        .rpc('get_user_study_groups', {
          p_user_id: user.id
        });

      if (procError) {
        console.error('API: Error calling stored procedure:', procError);
        throw procError;
      }

      if (!userGroups || userGroups.length === 0) {
        console.log('API: No study groups found for user');
        return NextResponse.json({ groups: [] });
      }

      console.log('API: Found user study groups:', userGroups.length);

      // Get latest messages for all groups
      const groupsWithMessages = await Promise.all(userGroups.map(async (group) => {
        // Get latest message for the group using stored procedure to bypass RLS
        console.log(`API: Fetching latest message for group ${group.id}`);

        // Try using the new stored procedure that includes profile information
        let messageWithProfileData = null;
        let profileProcError = null;

        try {
          const result = await supabase
            .rpc('get_latest_message_with_profile', {
              p_group_id: group.id
            });

          messageWithProfileData = result.data;
          profileProcError = result.error;
        } catch (err) {
          console.error(`API: Error calling get_latest_message_with_profile for group ${group.id}:`, err);
          profileProcError = { message: 'Failed to fetch latest message' };
        }

        let messageWithProfile = null;

        if (profileProcError) {
          console.error(`API: Error using get_latest_message_with_profile for group ${group.id}:`, profileProcError);

          // Fall back to direct query with join if stored procedure fails
          let directMessage = null;
          let messageError = null;

          try {
            const result = await supabase
              .from('group_chat_messages')
              .select(`
                *,
                sender:sender_id(id, full_name, username, avatar_url)
              `)
              .eq('study_group_id', group.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            directMessage = result.data;
            messageError = result.error;
          } catch (err) {
            console.error(`API: Error in direct query for group ${group.id}:`, err);
            messageError = { message: 'Failed to fetch message', code: 'QUERY_ERROR' };
          }

          if (messageError && messageError.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
            console.error(`API: Error fetching latest message for group ${group.id}:`, messageError);
          } else if (directMessage) {
            console.log(`API: Found latest message via direct query for group ${group.id}:`, directMessage.content);

            messageWithProfile = {
              ...directMessage,
              sender_name: directMessage.sender?.full_name || directMessage.sender?.username || 'Unknown',
              avatar_url: directMessage.sender?.avatar_url
            };

            console.log(`API: Message with profile for group ${group.id}:`, {
              content: messageWithProfile.content,
              sender_name: messageWithProfile.sender_name
            });
          } else {
            console.log(`API: No messages found for group ${group.id}`);
          }
        } else if (messageWithProfileData && messageWithProfileData.length > 0) {
          console.log(`API: Found latest message with profile via stored procedure for group ${group.id}:`, messageWithProfileData[0].content);

          messageWithProfile = {
            ...messageWithProfileData[0],
            sender_name: messageWithProfileData[0].full_name || messageWithProfileData[0].username || 'Unknown',
            avatar_url: messageWithProfileData[0].avatar_url
          };

          console.log(`API: Message with profile for group ${group.id}:`, {
            content: messageWithProfile.content,
            sender_name: messageWithProfile.sender_name
          });
        } else {
          console.log(`API: No messages found for group ${group.id} via stored procedure`);
        }

        return {
          ...group,
          latestMessage: messageWithProfile
        };
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

      console.log('API: Returning groups with messages:', groupsWithMessages.length);
      return NextResponse.json({ groups: groupsWithMessages });

    } catch (err) {
      console.error('API: Error fetching user groups:', err);
      return NextResponse.json({ error: 'Failed to fetch user groups' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in user-groups API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

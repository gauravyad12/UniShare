import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

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
        .rpc('get_user_study_groups_bypass_rls', {
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

        // Try using the stored procedure first
        const { data: latestMessageProc, error: procError } = await supabase
          .rpc('get_latest_group_message', {
            p_group_id: group.id
          });

        let latestMessage = null;

        if (procError) {
          console.error(`API: Error using stored procedure for group ${group.id}:`, procError);

          // Fall back to direct query if stored procedure fails
          const { data: directMessage, error: messageError } = await supabase
            .from('group_chat_messages')
            .select('*')
            .eq('study_group_id', group.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (messageError && messageError.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
            console.error(`API: Error fetching latest message for group ${group.id}:`, messageError);
          } else if (directMessage) {
            console.log(`API: Found latest message via direct query for group ${group.id}:`, directMessage.content);
            latestMessage = directMessage;
          } else {
            console.log(`API: No messages found for group ${group.id}`);
          }
        } else if (latestMessageProc && latestMessageProc.length > 0) {
          console.log(`API: Found latest message via stored procedure for group ${group.id}:`, latestMessageProc[0].content);
          latestMessage = latestMessageProc[0];
        } else {
          console.log(`API: No messages found for group ${group.id} via stored procedure`);
        }

        let messageWithProfile = null;

        if (latestMessage) {
          // Get the sender's profile information
          console.log(`API: Fetching profile for sender ${latestMessage.sender_id}`);
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('full_name, username, avatar_url')
            .eq('id', latestMessage.sender_id)
            .single();

          if (profileError) {
            console.error(`API: Error fetching profile for sender ${latestMessage.sender_id}:`, profileError);
          } else {
            console.log(`API: Found profile for sender ${latestMessage.sender_id}:`, profile);
          }

          messageWithProfile = {
            ...latestMessage,
            sender_name: profile?.full_name || profile?.username || 'Unknown',
            avatar_url: profile?.avatar_url
          };

          console.log(`API: Message with profile for group ${group.id}:`, {
            content: messageWithProfile.content,
            sender_name: messageWithProfile.sender_name
          });
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

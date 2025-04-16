import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simplified approach: Just return the current group from the URL
    // This avoids any potential RLS issues
    const url = new URL(request.url);
    const currentGroupId = url.searchParams.get('currentGroupId');

    if (!currentGroupId) {
      // If no current group ID is provided, return an empty array
      return NextResponse.json({ groups: [] });
    }

    // Get the current group
    const { data: currentGroup, error: groupError } = await supabase
      .from('study_groups')
      .select('*')
      .eq('id', currentGroupId)
      .single();

    if (groupError) {
      console.error('Error fetching current group:', groupError);
      return NextResponse.json({ error: 'Failed to fetch current group' }, { status: 500 });
    }

    if (!currentGroup) {
      return NextResponse.json({ groups: [] });
    }

    // Get latest message for the group
    const { data: latestMessage } = await supabase
      .from('group_chat_messages')
      .select('*')
      .eq('study_group_id', currentGroupId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let messageWithProfile = null;

    if (latestMessage) {
      // Get the sender's profile information
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, username, avatar_url')
        .eq('id', latestMessage.sender_id)
        .single();

      messageWithProfile = {
        ...latestMessage,
        full_name: profile?.full_name,
        username: profile?.username,
        avatar_url: profile?.avatar_url
      };
    }

    const groupWithMessage = {
      ...currentGroup,
      latestMessage: messageWithProfile
    };

    return NextResponse.json({ groups: [groupWithMessage] });
  } catch (error) {
    console.error('Error in user-groups API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

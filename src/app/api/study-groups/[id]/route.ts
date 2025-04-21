import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";


export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const supabase = createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the study group
    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .select('*')
      .eq('id', id)
      .single();

    if (groupError) {
      console.error('Error fetching study group:', groupError);
      return NextResponse.json({ error: 'Failed to fetch study group' }, { status: 500 });
    }

    if (!group) {
      return NextResponse.json({ error: 'Study group not found' }, { status: 404 });
    }

    // Check if user is the creator or a member
    const isCreator = group.created_by === user.id;

    if (!isCreator) {
      // Check if user is a member
      const { data: membership, error: membershipError } = await supabase
        .from('study_group_members')
        .select('*')
        .eq('study_group_id', id)
        .eq('user_id', user.id)
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') {
        console.error('Error checking membership:', membershipError);
        return NextResponse.json({ error: 'Failed to check membership' }, { status: 500 });
      }

      if (!membership) {
        return NextResponse.json({ error: 'Not authorized to view this group' }, { status: 403 });
      }
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Error in study-group API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

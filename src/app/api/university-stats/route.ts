import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all user profiles with university_id
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('university_id');

    if (error) {
      console.error('Error fetching user profiles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch university statistics' },
        { status: 500 }
      );
    }

    // Count users per university manually
    const stats = {};
    profiles.forEach(profile => {
      if (profile.university_id) {
        stats[profile.university_id] = (stats[profile.university_id] || 0) + 1;
      }
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

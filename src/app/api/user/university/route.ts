import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Set dynamic to force-dynamic to prevent caching
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get the user's university from the session
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        university: null,
        error: 'User not authenticated'
      }, { status: 401 });
    }

    // Get all user profiles to find the user's profile
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      return NextResponse.json({
        university: null,
        error: 'Error fetching user profiles'
      }, { status: 500 });
    }

    // Try to find the user's profile by matching the ID to any field
    const userProfile = userProfiles.find(profile => {
      return Object.values(profile).some(value =>
        value === user.id ||
        (typeof value === 'string' && value.includes(user.id))
      );
    });

    if (!userProfile) {
      // Don't include the user ID in logs
      console.warn(`Could not find user profile for current user`);
      return NextResponse.json({
        university: null,
        error: 'User profile not found'
      }, { status: 404 });
    }

    // Try different possible field names for university
    const university = userProfile?.university_name ||
                       userProfile?.university ||
                       userProfile?.school_name ||
                       userProfile?.school;

    if (!university) {
      console.warn('User does not have a university set in any known field');
      return NextResponse.json({
        university: null,
        error: 'University not set'
      }, { status: 404 });
    }

    return NextResponse.json({ university });
  } catch (error) {
    console.error('Error fetching user university:', error);
    return NextResponse.json({
      university: null,
      error: 'Failed to fetch user university',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

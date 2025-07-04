import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's current IQ points
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('iq_points')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Get active temporary access if any
    const { data: temporaryAccess } = await supabase
      .from('temporary_scholar_access')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check for regular subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    let subscriptionStatus = 'none';
    let temporaryAccessInfo = null;

    if (subscription) {
      const currentTime = Math.floor(Date.now() / 1000);
      const isValid = subscription.status === 'active' &&
                      (!subscription.current_period_end ||
                       subscription.current_period_end > currentTime);
      
      if (isValid) {
        subscriptionStatus = 'regular';
      }
    }

    if (temporaryAccess && subscriptionStatus === 'none') {
      subscriptionStatus = 'temporary';
      const expiresAt = new Date(temporaryAccess.expires_at);
      const now = new Date();
      const remainingMs = expiresAt.getTime() - now.getTime();
      const remainingHours = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)));

      temporaryAccessInfo = {
        expires_at: temporaryAccess.expires_at,
        points_spent: temporaryAccess.points_spent,
        access_duration_hours: temporaryAccess.access_duration_hours,
        remaining_hours: remainingHours
      };
    }

    // Get recent transactions (last 10)
    const { data: recentTransactions } = await supabase
      .from('iq_points_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      iq_points: profile?.iq_points || 0,
      subscription_status: subscriptionStatus,
      temporary_access: temporaryAccessInfo,
      recent_transactions: recentTransactions || []
    });

  } catch (error) {
    console.error('Error in IQ points status API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
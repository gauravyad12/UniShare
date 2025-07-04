import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
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

    const { duration_hours } = await request.json();

    if (!duration_hours || typeof duration_hours !== 'number') {
      return NextResponse.json(
        { error: 'Valid duration_hours is required' },
        { status: 400 }
      );
    }

    // Validate duration is available
    const { data: pricingOption, error: pricingError } = await supabase
      .from('scholar_plus_pricing')
      .select('*')
      .eq('duration_hours', duration_hours)
      .eq('is_active', true)
      .single();

    if (pricingError || !pricingOption) {
      return NextResponse.json(
        { error: 'Invalid duration option' },
        { status: 400 }
      );
    }

    // Check if user already has regular subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (subscription) {
      const currentTime = Math.floor(Date.now() / 1000);
      const isValid = subscription.status === 'active' &&
                      (!subscription.current_period_end ||
                       subscription.current_period_end > currentTime);

      if (isValid) {
        return NextResponse.json(
          { error: 'You already have an active Scholar+ subscription' },
          { status: 400 }
        );
      }
    }

    // Use the stored procedure to purchase access
    const { data: result, error: purchaseError } = await supabase
      .rpc('purchase_scholar_plus_access', {
        p_user_id: user.id,
        p_duration_hours: duration_hours
      });

    if (purchaseError) {
      console.error('Error purchasing Scholar+ access:', purchaseError);
      return NextResponse.json(
        { error: 'Failed to process purchase' },
        { status: 500 }
      );
    }

    // Parse the result (stored procedure returns JSON)
    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Purchase failed' },
        { status: 400 }
      );
    }

    // Get updated user points
    const { data: updatedProfile } = await supabase
      .from('user_profiles')
      .select('iq_points')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${duration_hours} hours of Scholar+ access!`,
      access_id: result.access_id,
      expires_at: result.expires_at,
      remaining_points: result.remaining_points,
      points_spent: pricingOption.points_cost,
      current_points: updatedProfile?.iq_points || 0
    });

  } catch (error) {
    console.error('Error in IQ points purchase API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
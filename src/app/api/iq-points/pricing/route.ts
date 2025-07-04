import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface PricingOption {
  id: string;
  duration_hours: number;
  points_cost: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get pricing options (this is public data, no auth required)
    const { data: pricing, error: pricingError } = await supabase
      .from('scholar_plus_pricing')
      .select('*')
      .eq('is_active', true)
      .order('duration_hours', { ascending: true });

    if (pricingError) {
      console.error('Error fetching pricing:', pricingError);
      return NextResponse.json(
        { error: 'Failed to fetch pricing data' },
        { status: 500 }
      );
    }

    // Calculate value metrics for each option
    const pricingWithMetrics = pricing?.map((option: PricingOption) => {
      const pointsPerHour = option.points_cost / option.duration_hours;
      const pointsPerDay = pointsPerHour * 24;
      
      // Calculate discount percentage (compare to 24-hour rate)
      const baseDailyRate = pricing?.find((p: PricingOption) => p.duration_hours === 24)?.points_cost || 100;
      const effectiveDailyRate = (option.points_cost / option.duration_hours) * 24;
      const discountPercentage = baseDailyRate > 0 
        ? Math.round((1 - effectiveDailyRate / baseDailyRate) * 100)
        : 0;

      return {
        ...option,
        points_per_hour: Math.round(pointsPerHour * 100) / 100,
        points_per_day: Math.round(pointsPerDay * 100) / 100,
        discount_percentage: Math.max(0, discountPercentage),
        formatted_duration: formatDuration(option.duration_hours),
        is_best_value: option.duration_hours === 720 // 1 month
      };
    }) || [];

    return NextResponse.json({
      success: true,
      pricing: pricingWithMetrics
    });

  } catch (error) {
    console.error('Error in IQ points pricing API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

function formatDuration(hours: number): string {
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  } else if (hours < 168) {
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? '' : 's'}`;
  } else if (hours < 720) {
    const weeks = Math.round(hours / 168);
    return `${weeks} week${weeks === 1 ? '' : 's'}`;
  } else {
    const months = Math.round(hours / 720);
    return `${months} month${months === 1 ? '' : 's'}`;
  }
} 
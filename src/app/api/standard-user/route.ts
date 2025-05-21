import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the Standard User university directly
    const { data: university, error } = await supabase
      .from('universities')
      .select('*')
      .eq('name', 'Standard User')
      .single();

    if (error) {
      console.error('Error fetching Standard User university:', error);
      return NextResponse.json(
        { error: 'Failed to fetch Standard User university' },
        { status: 500 }
      );
    }

    return NextResponse.json({ university });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

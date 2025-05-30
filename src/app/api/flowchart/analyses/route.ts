import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch previous analyses for the user
    const { data: analyses, error: dbError } = await supabase
      .from('flowchart_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10); // Limit to last 10 analyses

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analyses: analyses || []
    });

  } catch (error) {
    console.error('Fetch analyses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('id');

    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 });
    }

    // Delete the analysis (only if it belongs to the user)
    const { error: deleteError } = await supabase
      .from('flowchart_analyses')
      .delete()
      .eq('id', analysisId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete analysis' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Analysis deleted successfully'
    });

  } catch (error) {
    console.error('Delete analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
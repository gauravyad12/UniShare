import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Get job status
    const { data: job, error: jobError } = await supabase
      .from('essay_analysis_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id) // Ensure user can only access their own jobs
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Return job status and result if completed
    const response: any = {
      jobId: job.id,
      status: job.status,
      operationType: job.operation_type,
      createdAt: job.created_at,
      updatedAt: job.updated_at
    };

    if (job.status === 'completed' && job.result) {
      response.result = job.result;
      response.completedAt = job.completed_at;
    }

    if (job.status === 'failed' && job.error_message) {
      response.error = job.error_message;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Job status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Delete the job (only if it belongs to the user)
    const { error: deleteError } = await supabase
      .from('essay_analysis_jobs')
      .delete()
      .eq('id', jobId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Delete job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
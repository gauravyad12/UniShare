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
      .from('flowchart_analysis_jobs')
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
      filename: job.filename,
      createdAt: job.created_at,
      updatedAt: job.updated_at
    };

    if (job.status === 'completed' && job.analysis_result) {
      response.analysis = job.analysis_result;
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
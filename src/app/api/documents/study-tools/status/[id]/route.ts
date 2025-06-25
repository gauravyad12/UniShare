import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobId } = params;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Get job status
    const { data: job, error: jobError } = await supabase
      .from('document_study_jobs')
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
      documentIds: job.document_ids,
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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('DELETE job - Authentication failed:', {
        authError: authError?.message,
        hasUser: !!user,
        jobId: params.id
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobId } = params;

    if (!jobId) {
      console.error('DELETE job - Missing job ID');
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    console.log(`Attempting to delete document study job: ${jobId} for user: ${user.id}`);

    // First, check if the job exists and belongs to the user
    const { data: existingJob, error: fetchError } = await supabase
      .from('document_study_jobs')
      .select('id, user_id, status, operation_type')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('DELETE job - Error fetching job for verification:', {
        error: fetchError.message,
        code: fetchError.code,
        details: fetchError.details,
        hint: fetchError.hint,
        jobId,
        userId: user.id
      });
      
      if (fetchError.code === 'PGRST116') {
        // No rows returned - job doesn't exist or doesn't belong to user
        console.warn(`Job ${jobId} not found or doesn't belong to user ${user.id}`);
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Failed to verify job ownership' }, { status: 500 });
    }

    if (!existingJob) {
      console.warn(`Job ${jobId} not found for user ${user.id}`);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    console.log(`Job found for deletion:`, {
      jobId: existingJob.id,
      userId: existingJob.user_id,
      status: existingJob.status,
      operationType: existingJob.operation_type
    });

    // Delete the job (only if it belongs to the user)
    const { error: deleteError } = await supabase
      .from('document_study_jobs')
      .delete()
      .eq('id', jobId)
      .eq('user_id', user.id); // Ensure user can only delete their own jobs

    if (deleteError) {
      console.error('DELETE job - Database deletion failed:', {
        error: deleteError.message,
        code: deleteError.code,
        details: deleteError.details,
        hint: deleteError.hint,
        jobId,
        userId: user.id
      });
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
    }

    console.log(`Job deleted successfully: ${jobId} for user: ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('DELETE job - Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      jobId: params?.id,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
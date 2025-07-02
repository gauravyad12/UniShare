import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const operationType = searchParams.get('operation_type');
    const documentIdsStr = searchParams.get('document_ids');
    
    if (!operationType || !documentIdsStr) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    let documentIds: string[];
    try {
      documentIds = JSON.parse(documentIdsStr);
    } catch {
      return NextResponse.json({ error: 'Invalid document_ids format' }, { status: 400 });
    }

    // Build the query conditions
    let query = supabase
      .from('document_study_jobs')
      .select('*')
      .eq('user_id', user.id)
      .eq('operation_type', operationType)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false }); // Get most recent first

    // Add operation-specific parameter matching
    if (operationType === 'flashcards') {
      // For flashcards, don't filter by parameters - any flashcards for the documents are useful
      // Users can see previously generated flashcards regardless of difficulty/count settings
    } else if (operationType === 'quiz') {
      // For quiz, don't filter by parameters - any quiz for the documents is useful
      // Users can see previously generated quizzes regardless of difficulty/question count/type settings
    } else if (operationType === 'notes') {
      const style = searchParams.get('style') || 'structured';
      query = query.eq('style', style);
    }
    // No additional parameters for summary

    const { data: jobs, error: queryError } = await query;

    if (queryError) {
      console.error('Error querying cached jobs:', queryError);
      return NextResponse.json({ error: 'Failed to search cached results' }, { status: 500 });
    }

    // Find a job with matching document IDs
    const sortedDocumentIds = [...documentIds].sort();
    const matchingJob = jobs?.find((job: any) => {
      if (!job.document_ids || job.document_ids.length !== documentIds.length) {
        return false;
      }
      const sortedJobDocIds = [...job.document_ids].sort();
      return JSON.stringify(sortedJobDocIds) === JSON.stringify(sortedDocumentIds);
    });

    if (matchingJob && matchingJob.result) {
      console.log(`Found cached result for ${operationType} operation:`, matchingJob.id);
      
      // For quiz operations, ensure difficulty is included in the result
      let result = matchingJob.result;
      if (operationType === 'quiz' && !result.difficulty && matchingJob.difficulty) {
        result = { ...result, difficulty: matchingJob.difficulty };
        console.log(`Added missing difficulty to quiz result: ${matchingJob.difficulty}`);
      }
      
      return NextResponse.json({
        cached: true,
        result: result,
        jobId: matchingJob.id,
        completedAt: matchingJob.completed_at
      });
    }

    return NextResponse.json({ cached: false });

  } catch (error) {
    console.error('Cached result check error:', error);
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

    const { operationType, documentIds, difficulty, count, questionCount, questionTypes, style } = await request.json();
    
    if (!operationType || !documentIds || documentIds.length === 0) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Build the query conditions for deletion
    let query = supabase
      .from('document_study_jobs')
      .delete()
      .eq('user_id', user.id)
      .eq('operation_type', operationType);

    // Add operation-specific parameter matching
    if (operationType === 'flashcards') {
      // For flashcards, don't filter by parameters - delete any flashcards for the documents
    } else if (operationType === 'quiz') {
      // For quiz, don't filter by parameters - delete any quiz for the documents
    } else if (operationType === 'notes') {
      query = query.eq('style', style || 'structured');
    }
    // No additional parameters for summary

    const { data: jobs, error: fetchError } = await supabase
      .from('document_study_jobs')
      .select('id, document_ids')
      .eq('user_id', user.id)
      .eq('operation_type', operationType);

    if (fetchError) {
      console.error('Error fetching jobs for deletion:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch cached results' }, { status: 500 });
    }

    // Find jobs with matching document IDs
    const sortedDocumentIds = [...documentIds].sort();
    const jobsToDelete = jobs?.filter((job: any) => {
      if (!job.document_ids || job.document_ids.length !== documentIds.length) {
        return false;
      }
      const sortedJobDocIds = [...job.document_ids].sort();
      return JSON.stringify(sortedJobDocIds) === JSON.stringify(sortedDocumentIds);
    }) || [];

    if (jobsToDelete.length > 0) {
      const jobIds = jobsToDelete.map((job: any) => job.id);
      const { error: deleteError } = await supabase
        .from('document_study_jobs')
        .delete()
        .in('id', jobIds);

      if (deleteError) {
        console.error('Error deleting cached jobs:', deleteError);
        return NextResponse.json({ error: 'Failed to delete cached results' }, { status: 500 });
      }

      console.log(`Deleted ${jobsToDelete.length} cached ${operationType} jobs`);
    }

    return NextResponse.json({ 
      success: true, 
      deletedCount: jobsToDelete.length,
      message: `Deleted ${jobsToDelete.length} cached ${operationType} results`
    });

  } catch (error) {
    console.error('Cache deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
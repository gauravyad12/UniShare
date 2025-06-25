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
      const difficulty = searchParams.get('difficulty') || 'medium';
      const count = parseInt(searchParams.get('count') || '10');
      query = query.eq('difficulty', difficulty).eq('count', count);
    } else if (operationType === 'quiz') {
      const questionCount = parseInt(searchParams.get('question_count') || '10');
      const difficulty = searchParams.get('difficulty') || 'medium';
      const questionTypesStr = searchParams.get('question_types');
      let questionTypes: string[] = ['multiple-choice', 'true-false', 'short-answer'];
      if (questionTypesStr) {
        try {
          questionTypes = JSON.parse(questionTypesStr);
        } catch {
          // Use default if parsing fails
        }
      }
      query = query.eq('question_count', questionCount).eq('difficulty', difficulty).contains('question_types', questionTypes);
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
      return NextResponse.json({
        cached: true,
        result: matchingJob.result,
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
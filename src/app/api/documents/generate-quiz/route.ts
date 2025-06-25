import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's session token for the Edge Function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return NextResponse.json({ error: 'No valid session' }, { status: 401 });
    }

    const { documentIds, questionCount = 10, questionTypes = ['multiple-choice', 'true-false', 'short-answer'], difficulty = 'medium' } = await request.json();

    if (!documentIds || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing document IDs' },
        { status: 400 }
      );
    }

    // Validate documents exist and belong to user
    const { data: documents, error: documentsError } = await supabase
      .from('document_chat_documents')
      .select('id, name')
      .in('id', documentIds)
      .eq('user_id', user.id)
      .eq('status', 'ready');

    if (documentsError || !documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'No valid documents found' },
        { status: 400 }
      );
    }

    // Create processing job record
    const { data: job, error: jobError } = await supabase
      .from('document_study_jobs')
      .insert({
        user_id: user.id,
        document_ids: documentIds,
        operation_type: 'quiz',
        question_count: questionCount,
        question_types: questionTypes,
        difficulty: difficulty,
        status: 'pending'
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Failed to create processing job:', jobError);
      return NextResponse.json({ error: 'Failed to create processing job' }, { status: 500 });
    }

    // Trigger Edge Function asynchronously (fire and forget)
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/document-study-tools`;
    
    console.log('Triggering Document Study Tools Edge Function with URL:', edgeFunctionUrl);
    console.log('Job ID:', job.id);
    console.log('Operation: quiz');
    
    // Don't await this - let it run in background
    fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'quiz',
        jobId: job.id,
        userId: user.id,
        documentIds,
        questionCount,
        questionTypes,
        quizDifficulty: difficulty
      })
    }).then(response => {
      console.log('Document Study Tools Edge Function response status:', response.status);
      if (!response.ok) {
        console.error('Edge Function failed with status:', response.status);
        return response.text().then(text => {
          console.error('Edge Function error response:', text);
          throw new Error(`Edge Function failed: ${response.status} - ${text}`);
        });
      }
      console.log('Document Study Tools Edge Function triggered successfully');
    }).catch(error => {
      console.error('Failed to trigger Edge Function:', error);
      // Update job status to failed
      supabase
        .from('document_study_jobs')
        .update({ 
          status: 'failed', 
          error_message: `Failed to start processing: ${error.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)
        .then(() => {
          console.log('Updated job status to failed');
        });
    });

    // Return immediately with job ID
    return NextResponse.json({ 
      success: true, 
      jobId: job.id,
      status: 'pending',
      message: 'Quiz generation started. Please check status using the job ID.'
    });

  } catch (error) {
    console.error('Quiz generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


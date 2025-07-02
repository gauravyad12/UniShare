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

    // Check if user has an active Scholar+ subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Scholar+ subscription required' },
        { status: 403 }
      );
    }

    // Check if subscription is still valid
    const currentTime = Math.floor(Date.now() / 1000);
    const isValid = subscription.status === "active" &&
                    (!subscription.current_period_end ||
                     subscription.current_period_end > currentTime);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Active Scholar+ subscription required' },
        { status: 403 }
      );
    }

    // Get the user's session token for the Edge Function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return NextResponse.json({ error: 'No valid session' }, { status: 401 });
    }

    const { recordingIds, difficulty = 'medium', count = 10 } = await request.json();

    if (!recordingIds || recordingIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing recording IDs' },
        { status: 400 }
      );
    }

    // Validate recordings exist and belong to user
    const { data: recordings, error: recordingsError } = await supabase
      .from('lecture_recordings')
      .select('id, title, transcript')
      .in('id', recordingIds)
      .eq('user_id', user.id);

    if (recordingsError || !recordings || recordings.length === 0) {
      return NextResponse.json(
        { error: 'No valid recordings found' },
        { status: 400 }
      );
    }

    // Check if recordings have transcripts
    const recordingsWithTranscripts = recordings.filter((r: any) => r.transcript && r.transcript.trim().length > 0);
    if (recordingsWithTranscripts.length === 0) {
      const recordingTitles = recordings.map((r: any) => r.title).join(', ');
      return NextResponse.json(
        { 
          error: 'No transcript available', 
          message: `The recording "${recordingTitles}" doesn't have a transcript. To generate flashcards, please record a new lecture with speech or manually add a transcript to your recording.`,
          details: 'Flashcards require transcript content to analyze and create study materials from your lecture content.'
        },
        { status: 400 }
      );
    }

    // Create processing job record
    const { data: job, error: jobError } = await supabase
      .from('lecture_study_tools')
      .insert({
        user_id: user.id,
        recording_ids: recordingIds,
        operation_type: 'flashcards',
        parameters: { difficulty, count },
        status: 'pending'
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Failed to create processing job:', jobError);
      return NextResponse.json({ error: 'Failed to create processing job' }, { status: 500 });
    }

    // Trigger Edge Function asynchronously (fire and forget)
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/lecture-study-tools`;
    
    console.log('Triggering Lecture Study Tools Edge Function with URL:', edgeFunctionUrl);
    console.log('Job ID:', job.id);
    console.log('Operation: flashcards');
    
    // Don't await this - let it run in background
    fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'flashcards',
        jobId: job.id,
        userId: user.id,
        recordingIds,
        difficulty,
        count
      })
    }).then(response => {
      console.log('Lecture Study Tools Edge Function response status:', response.status);
      if (!response.ok) {
        console.error('Edge Function failed with status:', response.status);
        return response.text().then(text => {
          console.error('Edge Function error response:', text);
          throw new Error(`Edge Function failed: ${response.status} - ${text}`);
        });
      }
      console.log('Lecture Study Tools Edge Function triggered successfully');
    }).catch(error => {
      console.error('Failed to trigger Edge Function:', error);
      // Update job status to failed
      supabase
        .from('lecture_study_tools')
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
      message: 'Flashcard generation started. Please check status using the job ID.'
    });

  } catch (error) {
    console.error('Lecture flashcard generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 10; // Maximum duration for Vercel

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's session token for the Edge Function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return NextResponse.json({ error: 'No valid session' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, outline, essayType, wordCount, academicLevel, citationStyle, requirements } = body;

    if (!prompt?.trim() || !outline?.trim()) {
      return NextResponse.json({ error: 'Prompt and outline are required' }, { status: 400 });
    }

    // Create analysis job record
    const { data: job, error: jobError } = await supabase
      .from('essay_analysis_jobs')
      .insert({
        user_id: user.id,
        operation_type: 'content',
        prompt: prompt.trim(),
        outline: outline.trim(),
        essay_type: essayType,
        word_count: wordCount,
        academic_level: academicLevel,
        citation_style: citationStyle,
        requirements: requirements || [],
        status: 'pending'
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Failed to create essay analysis job:', jobError);
      return NextResponse.json({ error: 'Failed to create analysis job' }, { status: 500 });
    }

    // Trigger Edge Function asynchronously (fire and forget)
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/essay-generator`;
    
    console.log('Triggering Essay Generator Edge Function with URL:', edgeFunctionUrl);
    console.log('Job ID:', job.id);
    console.log('User ID:', user.id);
    
    // Don't await this - let it run in background
    fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'content',
        jobId: job.id,
        userId: user.id,
        prompt: prompt.trim(),
        outline: outline.trim(),
        essayType,
        wordCount,
        academicLevel,
        citationStyle,
        requirements: requirements || []
      })
    }).then(response => {
      console.log('Essay Generator Edge Function response status:', response.status);
      if (!response.ok) {
        console.error('Edge Function failed with status:', response.status);
        return response.text().then(text => {
          console.error('Edge Function error response:', text);
          throw new Error(`Edge Function failed: ${response.status} - ${text}`);
        });
      }
      console.log('Essay Generator Edge Function triggered successfully');
    }).catch(error => {
      console.error('Failed to trigger Edge Function:', error);
      // Update job status to failed
      supabase
        .from('essay_analysis_jobs')
        .update({ 
          status: 'failed', 
          error_message: `Failed to start analysis: ${error.message}`,
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
      message: 'Content generation started. Please check status using the job ID.'
    });

  } catch (error) {
    console.error('Essay content generation error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
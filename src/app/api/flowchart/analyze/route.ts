import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Set the runtime to edge for better performance
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

    const formData = await request.formData();
    const file = formData.get('flowchart') as File;
    const userCoursesStr = formData.get('userCourses') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload JPG or PNG images only.' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB for faster processing.' }, { status: 400 });
    }

    const userCourses = JSON.parse(userCoursesStr || '[]');

    // Create analysis job record
    const { data: job, error: jobError } = await supabase
      .from('flowchart_analysis_jobs')
      .insert({
        user_id: user.id,
        filename: file.name,
        file_size: file.size,
        status: 'pending'
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Failed to create analysis job:', jobError);
      return NextResponse.json({ error: 'Failed to create analysis job' }, { status: 500 });
    }

    // Convert file to base64 for Edge Function processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    
    // Get file extension for proper MIME type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg';
    if (fileExtension === 'png') mimeType = 'image/png';

    // Trigger Edge Function asynchronously (fire and forget)
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/flowchart-analyzer`;
    
    console.log('Triggering Edge Function with URL:', edgeFunctionUrl);
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
        base64Image,
        mimeType,
        userCourses,
        userId: user.id,
        filename: file.name,
        fileSize: file.size,
        jobId: job.id // Pass job ID to Edge Function
      })
    }).then(response => {
      console.log('Edge Function response status:', response.status);
      if (!response.ok) {
        console.error('Edge Function failed with status:', response.status);
        return response.text().then(text => {
          console.error('Edge Function error response:', text);
          throw new Error(`Edge Function failed: ${response.status} - ${text}`);
        });
      }
      console.log('Edge Function triggered successfully');
    }).catch(error => {
      console.error('Failed to trigger Edge Function:', error);
      // Update job status to failed
      supabase
        .from('flowchart_analysis_jobs')
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
      message: 'Analysis started. Please check status using the job ID.'
    });

  } catch (error) {
    console.error('Flowchart analysis error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
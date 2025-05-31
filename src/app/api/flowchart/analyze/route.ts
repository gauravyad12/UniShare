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

    // Convert file to base64 for Edge Function processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    
    // Get file extension for proper MIME type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg';
    if (fileExtension === 'png') mimeType = 'image/png';

    // Call Supabase Edge Function for analysis
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/flowchart-analyzer`;
    
    const analysisResponse = await fetch(edgeFunctionUrl, {
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
        fileSize: file.size
      })
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.json().catch(() => ({}));
      console.error('Edge Function error:', errorData);
      return NextResponse.json({ 
        error: errorData.error || 'Failed to analyze flowchart' 
      }, { status: analysisResponse.status });
    }

    const result = await analysisResponse.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Flowchart analysis error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
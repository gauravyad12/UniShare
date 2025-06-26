import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Helper function to process YouTube videos
async function processYouTubeVideo(supabase: any, document: any, user: any, session: any) {
  try {
    // Create processing job record for YouTube
    const { data: job, error: jobError } = await supabase
      .from('document_processing_jobs')
      .insert({
        user_id: user.id,
        document_id: document.id,
        filename: document.name,
        file_size: document.size,
        status: 'pending'
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Failed to create YouTube processing job:', jobError);
      return NextResponse.json({ error: 'Failed to create processing job' }, { status: 500 });
    }

    // Trigger Edge Function for YouTube processing
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/document-processor`;
    
    console.log('Triggering YouTube Processor Edge Function with URL:', edgeFunctionUrl);
    console.log('Job ID:', job.id);
    console.log('Document ID:', document.id);
    
    // Don't await this - let it run in background
    fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId: document.id,
        userId: user.id,
        filename: document.name,
        fileType: document.type,
        source: 'youtube',
        originalUrl: document.original_url,
        jobId: job.id
      })
    }).then(response => {
      console.log('YouTube Processor Edge Function response status:', response.status);
      if (!response.ok) {
        console.error('YouTube Edge Function failed with status:', response.status);
        return response.text().then(text => {
          console.error('YouTube Edge Function error response:', text);
          throw new Error(`YouTube Edge Function failed: ${response.status} - ${text}`);
        });
      }
      console.log('YouTube Processor Edge Function triggered successfully');
    }).catch(error => {
      console.error('Failed to trigger YouTube Edge Function:', error);
      // Update job status to failed
      supabase
        .from('document_processing_jobs')
        .update({ 
          status: 'failed', 
          error_message: `Failed to start YouTube processing: ${error.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)
        .then(() => {
          console.log('Updated YouTube job status to failed');
        });
    });

    // Return immediately with job ID
    return NextResponse.json({ 
      success: true, 
      jobId: job.id,
      status: 'pending',
      message: 'YouTube video processing started. Please check status using the job ID.'
    });

  } catch (error) {
    console.error('YouTube processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process YouTube video' },
      { status: 500 }
    );
  }
}

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

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Get document from database
    const { data: document, error: docError } = await supabase
      .from('document_chat_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.status === 'ready') {
      return NextResponse.json({ 
        success: true, 
        content: document.content,
        pageCount: document.page_count,
        textChunks: document.text_chunks
      });
    }

    // Handle different content sources
    if (document.source === 'text') {
      // Text content is already ready, no processing needed
      return NextResponse.json({ 
        success: true, 
        content: document.content,
        pageCount: 1,
        textChunks: document.content ? [{ content: document.content, page: 1 }] : []
      });
    }

    if (document.source === 'youtube') {
      // Handle YouTube video processing
      return await processYouTubeVideo(supabase, document, user, session);
    }

    // Handle file-based documents (PDFs, DOCX)
    if (!document.storage_path) {
      return NextResponse.json({ error: 'Document storage path not found' }, { status: 400 });
    }

    // Create processing job record
    const { data: job, error: jobError } = await supabase
      .from('document_processing_jobs')
      .insert({
        user_id: user.id,
        document_id: documentId,
        filename: document.name,
        file_size: document.size,
        status: 'pending'
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Failed to create processing job:', jobError);
      return NextResponse.json({ error: 'Failed to create processing job' }, { status: 500 });
    }

    // Get file from storage and convert to base64
    const { data: fileData, error: storageError } = await supabase.storage
      .from('document-uploads')
      .download(document.storage_path);

    if (storageError || !fileData) {
      console.error('Storage error:', storageError);
      return NextResponse.json({ error: 'Failed to retrieve file from storage' }, { status: 500 });
    }

    // Convert file to base64 for Edge Function processing
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Content = Buffer.from(arrayBuffer).toString('base64');

    // Trigger Edge Function asynchronously (fire and forget)
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/document-processor`;
    
    console.log('Triggering Document Processor Edge Function with URL:', edgeFunctionUrl);
    console.log('Job ID:', job.id);
    console.log('Document ID:', documentId);
    
    // Don't await this - let it run in background
    fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId: documentId,
        userId: user.id,
        filename: document.name,
        fileType: document.type,
        fileSize: document.size,
        jobId: job.id,
        base64Content: base64Content
      })
    }).then(response => {
      console.log('Document Processor Edge Function response status:', response.status);
      if (!response.ok) {
        console.error('Edge Function failed with status:', response.status);
        return response.text().then(text => {
          console.error('Edge Function error response:', text);
          throw new Error(`Edge Function failed: ${response.status} - ${text}`);
        });
      }
      console.log('Document Processor Edge Function triggered successfully');
    }).catch(error => {
      console.error('Failed to trigger Edge Function:', error);
      // Update job status to failed
      supabase
        .from('document_processing_jobs')
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
      message: 'Document processing started. Please check status using the job ID.'
    });

  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process document' },
      { status: 500 }
    );
  }
} 
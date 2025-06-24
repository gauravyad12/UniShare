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

    const formData = await request.formData();
    const file = formData.get('document') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // Validate file size (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${crypto.randomUUID()}.${fileExtension}`;
    const storagePath = `documents/${user.id}/${uniqueFilename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('document-uploads')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Create document record
    const documentId = crypto.randomUUID();
    const { data: documentData, error: documentError } = await supabase
      .from('document_chat_documents')
      .insert({
        id: documentId,
        user_id: user.id,
        name: file.name,
        type: file.type,
        size: file.size,
        storage_path: storagePath,
        status: 'processing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (documentError) {
      console.error('Document creation error:', documentError);
      
      // Clean up uploaded file
      await supabase.storage
        .from('document-uploads')
        .remove([storagePath]);
      
      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      );
    }

    // Start processing job
    try {
      const baseUrl = process.env.NODE_ENV === 'development' ? `http://localhost:${process.env.PORT || 3000}` : `https://${process.env.NEXT_PUBLIC_DOMAIN}`;
      
      const processingResponse = await fetch(`${baseUrl}/api/documents/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          userId: user.id,
          storagePath,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        }),
      });

      if (!processingResponse.ok) {
        console.error('Failed to start processing job');
        // Don't fail the upload, just mark as error
        await supabase
          .from('document_chat_documents')
          .update({
            status: 'error',
            error_message: 'Failed to start processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
      }
    } catch (processingError) {
      console.error('Processing job error:', processingError);
      // Don't fail the upload, just mark as error
      await supabase
        .from('document_chat_documents')
        .update({
          status: 'error',
          error_message: 'Failed to start processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);
    }

    return NextResponse.json({
      success: true,
      documentId,
      message: 'File uploaded successfully and processing started'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
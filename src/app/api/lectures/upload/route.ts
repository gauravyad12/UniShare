import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error in lecture upload:', authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const transcript = formData.get('transcript') as string;
    const duration = parseInt(formData.get('duration') as string);
    const audioFile = formData.get('audioFile') as File | null;
    
    console.log('Received lecture upload request:', { 
      hasName: !!name, 
      nameLength: name?.length,
      hasTranscript: !!transcript, 
      transcriptLength: transcript?.length,
      duration: duration,
      hasAudioFile: !!audioFile,
      audioFileSize: audioFile?.size
    });

    // Improved validation with better error messages
    const errors = [];
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push("name is required and must be a non-empty string");
    }
    if (transcript === undefined || transcript === null) {
      errors.push("transcript is required");
    }
    if (duration === undefined || duration === null || typeof duration !== 'number') {
      errors.push("duration is required and must be a number");
    }

    if (errors.length > 0) {
      console.error('Validation errors in lecture upload:', errors);
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    // Upload audio file to Supabase Storage if provided
    let audioFilePath = null;
    if (audioFile) {
      try {
        // Determine file extension based on MIME type
        let fileExtension = 'webm'; // Default
        if (audioFile.type.includes('wav')) {
          fileExtension = 'wav';
        } else if (audioFile.type.includes('mp3') || audioFile.type.includes('mpeg')) {
          fileExtension = 'mp3';
        } else if (audioFile.type.includes('mp4')) {
          fileExtension = 'mp4';
        } else if (audioFile.type.includes('ogg')) {
          fileExtension = 'ogg';
        }
        
        console.log('Uploading audio file:', {
          type: audioFile.type,
          size: audioFile.size,
          extension: fileExtension
        });
        
        // Generate unique filename
        const fileName = `${user.id}/${Date.now()}.${fileExtension}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('lecture-audio')
          .upload(fileName, audioFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: audioFile.type
          });

        if (uploadError) {
          console.error('Error uploading audio to storage:', uploadError);
          throw new Error(`Failed to upload audio: ${uploadError.message}`);
        }

        audioFilePath = uploadData.path;
        console.log('Successfully uploaded audio file:', {
          path: audioFilePath,
          size: audioFile.size
        });
      } catch (audioUploadError) {
        console.error('Audio upload failed:', audioUploadError);
        throw new Error('Failed to save audio file');
      }
    }

    // Insert the lecture recording into the database
    const { data: recording, error: insertError } = await supabase
      .from('lecture_recordings')
      .insert({
        user_id: user.id,
        title: name.trim(),
        transcript: transcript || "", // Allow empty transcript
        duration: Math.max(0, Math.round(duration)), // Ensure positive integer
        audio_url: audioFilePath
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting lecture recording:', insertError);
      return NextResponse.json(
        { error: "Failed to save lecture recording", details: insertError.message },
        { status: 500 }
      );
    }

    console.log('Successfully saved lecture recording:', recording.id);
    return NextResponse.json({ recording });

  } catch (error) {
    console.error('Error in lecture upload:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
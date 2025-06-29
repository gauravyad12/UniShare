import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recordingId = params.id;

    // First, get the recording with audio file path to verify ownership and get file info
    const { data: recording, error: selectError } = await supabase
      .from('lecture_recordings')
      .select('user_id, audio_url')
      .eq('id', recordingId)
      .single();

    if (selectError || !recording) {
      return NextResponse.json(
        { error: "Lecture recording not found" },
        { status: 404 }
      );
    }

    if (recording.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this recording" },
        { status: 403 }
      );
    }

    // Delete the audio file from Supabase Storage if it exists
    if (recording.audio_url) {
      console.log('Deleting audio file from storage:', recording.audio_url);
      
      const { error: storageDeleteError } = await supabase.storage
        .from('lecture-audio')
        .remove([recording.audio_url]);

      if (storageDeleteError) {
        console.error('Error deleting audio file from storage:', storageDeleteError);
        // Continue with database deletion even if storage deletion fails
        // This prevents orphaned database records
      } else {
        console.log('Successfully deleted audio file from storage');
      }
    }

    // Delete related study tool jobs that reference this recording
    console.log('Deleting related study tool jobs for recording:', recordingId);
    
    const { error: studyToolsDeleteError } = await supabase
      .from('lecture_study_tools')
      .delete()
      .contains('recording_ids', [recordingId]);

    if (studyToolsDeleteError) {
      console.error('Error deleting related study tool jobs:', studyToolsDeleteError);
      // Continue with recording deletion even if study tools deletion fails
      // This prevents the main recording from being left in an inconsistent state
    } else {
      console.log('Successfully deleted related study tool jobs');
    }

    // Delete the recording from database
    const { error: deleteError } = await supabase
      .from('lecture_recordings')
      .delete()
      .eq('id', recordingId);

    if (deleteError) {
      console.error('Error deleting lecture recording from database:', deleteError);
      return NextResponse.json(
        { error: "Failed to delete lecture recording" },
        { status: 500 }
      );
    }

    console.log('Successfully deleted recording:', recordingId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in lecture DELETE:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
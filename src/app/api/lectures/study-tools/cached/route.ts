import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const operationType = searchParams.get('operation_type');
    const recordingIds = searchParams.get('recording_ids');

    if (!operationType || !recordingIds) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const parsedRecordingIds = JSON.parse(recordingIds);
    console.log('Checking for cached lecture study tools:', {
      user_id: user.id,
      operation_type: operationType,
      recording_ids: parsedRecordingIds,
      parameters: operationType === 'notes' ? 'with style parameter' : 'any (parameter-free matching)'
    });

    let query = supabase
      .from('lecture_study_tools')
      .select('*')
      .eq('user_id', user.id)
      .eq('operation_type', operationType)
      .eq('status', 'completed')
      .contains('recording_ids', parsedRecordingIds);

    // Add parameter matching only for notes operation
    if (operationType === 'notes') {
      const style = searchParams.get('style');
      if (style) {
        // For notes, we still filter by style parameter
        query = query.contains('parameters', { style });
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cached result:', error);
      return NextResponse.json({ error: "Error fetching cached result" }, { status: 500 });
    }

    if (data && data.length > 0) {
      const result = data[0];
      console.log(`Found cached ${operationType} result:`, result.id);
      
      // Parse the result JSON
      let parsedResult = typeof result.result === 'string' ? JSON.parse(result.result) : result.result;
      
      // For quiz results, add difficulty from parameters if missing from result
      if (operationType === 'quiz' && !parsedResult.difficulty) {
        const parameters = typeof result.parameters === 'string' ? JSON.parse(result.parameters) : result.parameters;
        if (parameters && parameters.difficulty) {
          parsedResult.difficulty = parameters.difficulty;
          console.log('Added missing difficulty to quiz result:', parameters.difficulty);
        }
      }
      
      console.log(`Found cached result for ${operationType} operation:`, result.id);
      return NextResponse.json(parsedResult);
    }

    console.log('No cached result found');
    return NextResponse.json(null);

  } catch (error) {
    console.error('Error fetching cached result:', error);
    return NextResponse.json({ error: "Error fetching cached result" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const operationType = searchParams.get('operation_type');
    const recordingIds = searchParams.get('recording_ids');

    if (!operationType || !recordingIds) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const parsedRecordingIds = JSON.parse(recordingIds);
    console.log('Deleting cached lecture study tools:', {
      user_id: user.id,
      operation_type: operationType,
      recording_ids: parsedRecordingIds,
      parameters: operationType === 'notes' ? 'with style parameter' : 'all cached results'
    });

    let query = supabase
      .from('lecture_study_tools')
      .delete()
      .eq('user_id', user.id)
      .eq('operation_type', operationType)
      .contains('recording_ids', parsedRecordingIds);

    // Add parameter matching only for notes operation
    if (operationType === 'notes') {
      const style = searchParams.get('style');
      if (style) {
        query = query.contains('parameters', { style });
      }
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting cached results:', error);
      return NextResponse.json({ error: "Error deleting cached results" }, { status: 500 });
    }

    console.log(`Deleted cached ${operationType} results`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting cached results:', error);
    return NextResponse.json({ error: "Error deleting cached results" }, { status: 500 });
  }
}
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
      return NextResponse.json(
        { error: "Missing required parameters: operation_type, recording_ids" },
        { status: 400 }
      );
    }

    let parsedRecordingIds: string[];
    try {
      parsedRecordingIds = JSON.parse(recordingIds);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid recording_ids format" },
        { status: 400 }
      );
    }

    // Build parameters object for comparison
    const parameters: any = {};
    
    // Add operation-specific parameters
    if (operationType === 'flashcards') {
      parameters.difficulty = searchParams.get('difficulty') || 'medium';
      parameters.count = parseInt(searchParams.get('count') || '10');
    } else if (operationType === 'quiz') {
      parameters.questionCount = parseInt(searchParams.get('questionCount') || '10');
      parameters.questionTypes = JSON.parse(searchParams.get('questionTypes') || '["multiple-choice"]');
      parameters.difficulty = searchParams.get('difficulty') || 'medium';
    } else if (operationType === 'notes') {
      parameters.style = searchParams.get('style') || 'structured';
    }

    console.log('Checking for cached lecture study tools:', {
      user_id: user.id,
      operation_type: operationType,
      recording_ids: parsedRecordingIds,
      parameters
    });

    // Check for cached result using direct query
    const { data: cachedResults, error: selectError } = await supabase
      .from('lecture_study_tools')
      .select('*')
      .eq('user_id', user.id)
      .eq('operation_type', operationType)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    if (selectError) {
      console.error('Error checking cached lecture study tools:', selectError);
      return NextResponse.json(
        { error: "Failed to check cached results" },
        { status: 500 }
      );
    }

    // Filter results manually to find matching recording IDs and parameters
    const matchingResult = cachedResults?.find((result: any) => {
      const resultRecordingIds = result.recording_ids || [];
      const resultParams = result.parameters || {};
      
      // Check if arrays are equal (same length and same elements)
      const idsMatch = resultRecordingIds.length === parsedRecordingIds.length &&
        resultRecordingIds.every((id: string) => parsedRecordingIds.includes(id)) &&
        parsedRecordingIds.every(id => resultRecordingIds.includes(id));
      
      // Check if parameters match (order-independent)
      const paramsMatch = Object.keys(resultParams).length === Object.keys(parameters).length &&
        Object.entries(resultParams).every(([key, value]) => {
          if (Array.isArray(value) && Array.isArray(parameters[key])) {
            // For arrays, check if they contain the same elements
            return value.length === parameters[key].length &&
              value.every((item: any) => parameters[key].includes(item)) &&
              parameters[key].every((item: any) => value.includes(item));
          }
          return parameters[key] === value;
        });
      
      // Log successful cache hits for monitoring
      if (idsMatch && paramsMatch) {
        console.log(`Found cached ${operationType} result:`, result.id);
      }
      
      return idsMatch && paramsMatch;
    });

    if (matchingResult) {
      console.log(`Found cached result for ${operationType} operation:`, matchingResult.id);
      return NextResponse.json(matchingResult.result);
    }

    console.log('No cached result found');
    return NextResponse.json(null);

  } catch (error) {
    console.error('Error in lecture study tools cached GET:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Missing required parameters: operation_type, recording_ids" },
        { status: 400 }
      );
    }

    let parsedRecordingIds: string[];
    try {
      parsedRecordingIds = JSON.parse(recordingIds);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid recording_ids format" },
        { status: 400 }
      );
    }

    // Build parameters object for comparison
    const parameters: any = {};
    
    // Add operation-specific parameters
    if (operationType === 'flashcards') {
      parameters.difficulty = searchParams.get('difficulty') || 'medium';
      parameters.count = parseInt(searchParams.get('count') || '10');
    } else if (operationType === 'quiz') {
      parameters.questionCount = parseInt(searchParams.get('questionCount') || '10');
      parameters.questionTypes = JSON.parse(searchParams.get('questionTypes') || '["multiple-choice"]');
      parameters.difficulty = searchParams.get('difficulty') || 'medium';
    } else if (operationType === 'notes') {
      parameters.style = searchParams.get('style') || 'structured';
    }

    console.log('Deleting cached lecture study tools:', {
      user_id: user.id,
      operation_type: operationType,
      recording_ids: parsedRecordingIds,
      parameters
    });

    // Find and delete matching cached results
    const { data: cachedResults, error: selectError } = await supabase
      .from('lecture_study_tools')
      .select('*')
      .eq('user_id', user.id)
      .eq('operation_type', operationType)
      .eq('status', 'completed');

    if (selectError) {
      console.error('Error finding cached lecture study tools:', selectError);
      return NextResponse.json(
        { error: "Failed to find cached results" },
        { status: 500 }
      );
    }

    // Filter results manually to find matching recording IDs and parameters
    const matchingResults = cachedResults?.filter((result: any) => {
      const resultRecordingIds = result.recording_ids || [];
      const resultParams = result.parameters || {};
      
      // Check if arrays are equal (same length and same elements)
      const idsMatch = resultRecordingIds.length === parsedRecordingIds.length &&
        resultRecordingIds.every((id: string) => parsedRecordingIds.includes(id)) &&
        parsedRecordingIds.every(id => resultRecordingIds.includes(id));
      
      // Check if parameters match (order-independent)
      const paramsMatch = Object.keys(resultParams).length === Object.keys(parameters).length &&
        Object.entries(resultParams).every(([key, value]) => {
          if (Array.isArray(value) && Array.isArray(parameters[key])) {
            // For arrays, check if they contain the same elements
            return value.length === parameters[key].length &&
              value.every((item: any) => parameters[key].includes(item)) &&
              parameters[key].every((item: any) => value.includes(item));
          }
          return parameters[key] === value;
        });
      
      return idsMatch && paramsMatch;
    }) || [];

    if (matchingResults.length > 0) {
      const idsToDelete = matchingResults.map((r: any) => r.id);
      
      const { error: deleteError } = await supabase
        .from('lecture_study_tools')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('Error deleting cached results:', deleteError);
        return NextResponse.json(
          { error: "Failed to delete cached results" },
          { status: 500 }
        );
      }

      console.log(`Deleted ${matchingResults.length} cached ${operationType} result(s)`);
      return NextResponse.json({ 
        success: true, 
        deletedCount: matchingResults.length 
      });
    }

    console.log('No matching cached results found to delete');
    return NextResponse.json({ 
      success: true, 
      deletedCount: 0 
    });

  } catch (error) {
    console.error('Error in lecture study tools cached DELETE:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
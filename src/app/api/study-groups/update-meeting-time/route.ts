import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { meetingId, startTime, endTime } = await request.json();

    if (!meetingId) {
      return NextResponse.json({ error: "Meeting ID is required" }, { status: 400 });
    }

    if (!startTime || !endTime) {
      return NextResponse.json({ error: "Start and end times are required" }, { status: 400 });
    }

    // Validate that end time is after start time
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }
    
    if (startDate >= endDate) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    console.log(`Updating meeting ${meetingId} time by user ${user.id}`);

    // Use the raw SQL function to bypass RLS policies
    const { data: rawResult, error: sqlError } = await supabase
      .rpc('update_study_session_time_raw', {
        p_session_id: meetingId,
        p_start_time: startTime,
        p_end_time: endTime,
        p_user_id: user.id
      });

    console.log('Raw SQL result:', rawResult);

    if (sqlError) {
      console.error("Error executing SQL function:", sqlError);
      return NextResponse.json({
        error: `Error updating meeting time: ${sqlError.message}`
      }, { status: 500 });
    }

    // Parse the JSON result
    let result;
    try {
      if (rawResult) {
        result = JSON.parse(rawResult);
        console.log('Parsed result:', result);
      } else {
        console.error('No result returned from SQL function');
        return NextResponse.json({
          error: "No result returned from SQL function"
        }, { status: 500 });
      }
    } catch (parseError) {
      console.error("Error parsing SQL result:", parseError);
      console.log("Raw result:", rawResult);
      return NextResponse.json({
        error: `Failed to parse result: ${parseError.message}`
      }, { status: 500 });
    }

    // Check for errors
    if (!result.success) {
      console.error("Error from SQL function:", result.message);
      
      if (result.message.includes("not found")) {
        return NextResponse.json({
          error: result.message
        }, { status: 404 });
      }
      
      if (result.message.includes("Only the creator")) {
        return NextResponse.json({
          error: result.message
        }, { status: 403 });
      }
      
      return NextResponse.json({
        error: result.message
      }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: result.message || 'Meeting time updated successfully'
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({
      error: "An unexpected error occurred"
    }, { status: 500 });
  }
}

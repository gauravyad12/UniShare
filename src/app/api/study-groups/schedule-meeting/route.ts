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

    const { 
      groupId, 
      title, 
      description, 
      startTime, 
      endTime, 
      location, 
      isOnline, 
      meetingLink 
    } = await request.json();

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!startTime || !endTime) {
      return NextResponse.json({ error: "Start and end times are required" }, { status: 400 });
    }

    console.log(`Scheduling meeting for group ${groupId} by user ${user.id}`);

    // Use the raw SQL function to bypass RLS policies
    const { data: rawResult, error: sqlError } = await supabase
      .rpc('schedule_study_session_raw', {
        p_study_group_id: groupId,
        p_title: title,
        p_description: description || '',
        p_start_time: startTime,
        p_end_time: endTime,
        p_location: location || '',
        p_is_online: isOnline || false,
        p_meeting_link: meetingLink || '',
        p_user_id: user.id
      });

    console.log('Raw SQL result:', rawResult);

    if (sqlError) {
      console.error("Error executing SQL function:", sqlError);
      return NextResponse.json({
        error: `Error scheduling meeting: ${sqlError.message}`
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
      
      if (result.message.includes("must be a member")) {
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
      id: result.id,
      message: result.message || 'Meeting scheduled successfully'
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({
      error: "An unexpected error occurred"
    }, { status: 500 });
  }
}

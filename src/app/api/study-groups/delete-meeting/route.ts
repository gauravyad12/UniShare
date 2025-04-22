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

    const { meetingId } = await request.json();

    if (!meetingId) {
      return NextResponse.json({ error: "Meeting ID is required" }, { status: 400 });
    }

    console.log(`Deleting meeting ${meetingId} by user ${user.id}`);

    // Use the raw SQL function to bypass RLS policies
    const { data: rawResult, error: sqlError } = await supabase
      .rpc('delete_study_session_raw', {
        p_session_id: meetingId,
        p_user_id: user.id
      });

    console.log('Raw SQL result:', rawResult);

    if (sqlError) {
      console.error("Error executing SQL function:", sqlError);
      return NextResponse.json({
        error: `Error deleting meeting: ${sqlError.message}`
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
      message: result.message || 'Meeting deleted successfully'
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({
      error: "An unexpected error occurred"
    }, { status: 500 });
  }
}

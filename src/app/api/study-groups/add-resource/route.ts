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

    const { groupId, resourceId } = await request.json();

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    if (!resourceId) {
      return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
    }

    console.log(`Adding resource ${resourceId} to group ${groupId} by user ${user.id}`);

    console.log(`Using raw SQL function to add resource ${resourceId} to group ${groupId}`);

    // Use the raw SQL function to bypass RLS policies
    const { data: rawResult, error: sqlError } = await supabase
      .rpc('add_resource_to_group_raw', {
        p_group_id: groupId,
        p_resource_id: resourceId,
        p_user_id: user.id
      });

    console.log('Raw SQL result:', rawResult);

    if (sqlError) {
      console.error("Error executing SQL function:", sqlError);
      return NextResponse.json({
        error: `Error adding resource: ${sqlError.message}`
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

    // Check if the resource already exists
    if (!result.success && result.message.includes('already exists')) {
      console.log('Resource already exists in group');
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: "Resource already in group"
      });
    }

    // Check for other errors
    if (!result.success) {
      console.error("Error from SQL function:", result.message);
      return NextResponse.json({
        error: result.message
      }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      id: result.id,
      resourceId,
      message: result.message || 'Resource added successfully'
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({
      error: "An unexpected error occurred"
    }, { status: 500 });
  }
}

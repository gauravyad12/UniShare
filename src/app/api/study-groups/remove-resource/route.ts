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

    console.log(`Removing resource ${resourceId} from group ${groupId} by user ${user.id}`);

    console.log(`Using raw SQL function to remove resource ${resourceId} from group ${groupId}`);

    // Use the raw SQL function to bypass RLS policies
    const { data: rawResult, error: sqlError } = await supabase
      .rpc('remove_resource_from_group_raw', {
        p_group_id: groupId,
        p_resource_id: resourceId,
        p_user_id: user.id
      });

    console.log('Raw SQL result:', rawResult);

    if (sqlError) {
      console.error("Error executing SQL function:", sqlError);
      return NextResponse.json({
        error: `Error removing resource: ${sqlError.message}`
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

      if (result.message.includes("not found")) {
        return NextResponse.json({
          error: result.message
        }, { status: 404 });
      }

      return NextResponse.json({
        error: result.message
      }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Resource removed successfully"
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({
      error: "An unexpected error occurred"
    }, { status: 500 });
  }
}

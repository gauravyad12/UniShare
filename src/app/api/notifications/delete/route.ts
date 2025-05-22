import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

/**
 * API endpoint for deleting notifications
 *
 * DELETE /api/notifications/delete
 *
 * Request body:
 * {
 *   id?: string;           // Optional: ID of the specific notification to delete
 *   deleteAll?: boolean;   // Optional: If true, delete all notifications for the user
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log("DELETE /api/notifications/delete - Request received");

    // Authenticate the request
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log("DELETE /api/notifications/delete - Unauthorized, no user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`DELETE /api/notifications/delete - Authenticated user: ${user.id}`);

    // Parse request body
    const body = await request.json();
    const { id, deleteAll } = body;

    console.log(`DELETE /api/notifications/delete - Request body:`, body);

    // Validate that at least one parameter is provided
    if (!id && deleteAll !== true) {
      console.log("DELETE /api/notifications/delete - Invalid request, missing id or deleteAll");
      return NextResponse.json(
        { error: "Either id or deleteAll must be provided" },
        { status: 400 }
      );
    }

    let result;

    if (deleteAll) {
      console.log(`DELETE /api/notifications/delete - Deleting all notifications for user ${user.id}`);

      // Delete all notifications for the user
      result = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);
    } else {
      console.log(`DELETE /api/notifications/delete - Deleting notification ${id} for user ${user.id}`);

      // Delete a specific notification
      result = await supabase
        .from("notifications")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id); // Ensure the notification belongs to the user
    }

    console.log(`DELETE /api/notifications/delete - Supabase result:`, result);

    if (result.error) {
      console.error(`DELETE /api/notifications/delete - Error:`, result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    console.log(`DELETE /api/notifications/delete - Success, deleted ${result.count || 0} notifications`);

    return NextResponse.json({
      success: true,
      message: deleteAll ? "All notifications deleted" : "Notification deleted",
      count: result.count || 0
    });
  } catch (error) {
    console.error("Error in delete notification API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sendNotification } from "@/utils/notifications";

export const dynamic = "force-dynamic";

/**
 * API endpoint for sending notifications (both in-app and push)
 * 
 * POST /api/notifications/send
 * 
 * Request body:
 * {
 *   userId: string;          // Required: ID of the user to send the notification to
 *   title: string;           // Required: Title of the notification
 *   message: string;         // Required: Body of the notification
 *   type: string;            // Required: Type of notification (e.g., "follow", "meeting", etc.)
 *   link?: string;           // Optional: URL to open when notification is clicked
 *   relatedId?: string;      // Optional: ID of related entity (e.g., resource ID, study group ID)
 *   actorId?: string;        // Optional: ID of the user who triggered the notification
 *   sendPush?: boolean;      // Optional: Whether to send a push notification (default: true)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const {
      userId,
      title,
      message,
      type,
      link,
      relatedId,
      actorId = user.id,
      sendPush = true
    } = await request.json();

    // Validate required fields
    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { error: "userId, title, message, and type are required" },
        { status: 400 }
      );
    }

    // Send notification
    const result = await sendNotification(
      {
        user_id: userId,
        title,
        message,
        type,
        link,
        related_id: relatedId,
        actor_id: actorId,
        is_read: false,
        created_at: new Date().toISOString()
      },
      sendPush
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
      data: result.data
    });
  } catch (error) {
    console.error("Error in send notification API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

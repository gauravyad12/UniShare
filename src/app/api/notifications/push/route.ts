import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sendPushNotification } from "@/utils/appilix";

export const dynamic = "force-dynamic";

/**
 * API endpoint for sending push notifications via Appilix
 * 
 * POST /api/notifications/push
 * 
 * Request body:
 * {
 *   title: string;           // Required: Title of the notification
 *   message: string;         // Required: Body of the notification
 *   userEmail?: string;      // Optional: Email of the specific user to send to
 *   link?: string;           // Optional: URL to open when notification is clicked
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
    const { title, message, userEmail, link } = await request.json();

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    // Send push notification
    const result = await sendPushNotification({
      title,
      body: message,
      userIdentity: userEmail,
      openLinkUrl: link
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Push notification sent successfully",
      data: result.data
    });
  } catch (error) {
    console.error("Error in push notification API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

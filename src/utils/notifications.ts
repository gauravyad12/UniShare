import { createClient } from "@/utils/supabase/server";
import { sendPushNotification } from "@/utils/appilix";

/**
 * Type definition for a notification
 */
export type NotificationData = {
  user_id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  related_id?: string;
  actor_id?: string;
  is_read?: boolean;
  created_at?: string;
};

/**
 * Send a notification to a user
 * This will create an in-app notification and also send a push notification via Appilix
 * 
 * @param notification The notification data
 * @param sendPush Whether to also send a push notification (default: true)
 * @returns Object with success status and any error message
 */
export async function sendNotification(
  notification: NotificationData,
  sendPush: boolean = true
): Promise<{ success: boolean; message?: string; data?: any }> {
  try {
    const supabase = createClient();

    // Create in-app notification
    const { data, error } = await supabase
      .from("notifications")
      .insert(notification)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create in-app notification: ${error.message}`);
    }

    // If push notifications are enabled, send one
    if (sendPush) {
      try {
        // Get the user's email for targeting the push notification
        const { data: userData, error: userError } = await supabase
          .from("user_profiles")
          .select("email")
          .eq("id", notification.user_id)
          .single();

        if (userError || !userData?.email) {
          console.warn(`Could not find email for user ${notification.user_id}, sending broadcast notification`);
        }

        // Send push notification
        await sendPushNotification({
          title: notification.title,
          body: notification.message,
          userIdentity: userData?.email, // Will be undefined if user email not found
          openLinkUrl: notification.link ? `${process.env.NODE_ENV === 'development' ? `http://localhost:${process.env.PORT || 3000}` : `https://${process.env.NEXT_PUBLIC_DOMAIN}`}${notification.link}` : undefined
        });
      } catch (pushError) {
        // Log push notification error but don't fail the whole operation
        console.error("Error sending push notification:", pushError);
      }
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error("Error sending notification:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

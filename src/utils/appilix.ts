/**
 * Utility functions for interacting with the Appilix API
 */

/**
 * Send a push notification via Appilix API
 *
 * @param title The title of the notification
 * @param body The body/description of the notification
 * @param userIdentity Optional user identity (email) to send to a specific user
 * @param openLinkUrl Optional URL to open when the notification is clicked
 * @returns Promise with the API response
 */
export async function sendPushNotification({
  title,
  body,
  userIdentity,
  openLinkUrl
}: {
  title: string;
  body: string;
  userIdentity?: string;
  openLinkUrl?: string;
}): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Validate required environment variables
    const appKey = process.env.APPILIX_APP_KEY;
    const apiKey = process.env.APPILIX_API_KEY;

    if (!appKey || !apiKey) {
      throw new Error("Appilix API keys not configured");
    }

    // Prepare form data (using URLSearchParams as shown in the documentation)
    const formData = new URLSearchParams();
    formData.append('app_key', appKey);
    formData.append('api_key', apiKey);
    formData.append('notification_title', title);
    formData.append('notification_body', body);

    // Add optional parameters if provided
    if (userIdentity) {
      formData.append('user_identity', userIdentity);
    }

    if (openLinkUrl) {
      formData.append('open_link_url', openLinkUrl);
    }

    // Log the payload for debugging
    console.log("Sending push notification with payload:", formData.toString());

    // Send request to Appilix API using form data as shown in the documentation
    const response = await fetch("https://appilix.com/api/push-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    // Log the raw response for debugging
    const responseText = await response.text();
    console.log("Push notification API response:", response.status, responseText);

    // Parse response as JSON if possible
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      data = { error: "Invalid response format", raw: responseText };
    }

    if (!response.ok) {
      throw new Error(data.message || "Failed to send push notification");
    }

    return {
      success: true,
      message: "Push notification sent successfully",
      data,
    };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

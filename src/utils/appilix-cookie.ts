/**
 * Utility functions for managing Appilix user identity cookies
 */

/**
 * Sets the Appilix user identity cookie
 * @param userEmail The user's email to use as identity
 */
export function setAppilixIdentityCookie(userEmail: string): void {
  try {
    // Set cookie with user identity that expires in 365 days
    // The cookie name must be exactly 'appilix_push_notification_user_identity'
    document.cookie = `appilix_push_notification_user_identity=${encodeURIComponent(userEmail)};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  } catch (error) {
    // Silent error handling
  }
}

/**
 * Gets the Appilix user identity from cookies
 * @returns The user identity or null if not found
 */
export function getAppilixIdentityCookie(): string | null {
  try {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'appilix_push_notification_user_identity') {
        return decodeURIComponent(value);
      }
    }
    return null;
  } catch (error) {
    // Silent error handling
    return null;
  }
}

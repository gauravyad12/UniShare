/**
 * Utility functions for checking URL safety using Google Safe Browsing API
 */

/**
 * Checks if a URL is safe using Google Safe Browsing API
 * @param url The URL to check
 * @returns An object with isSafe boolean and any threat details
 */
export async function checkUrlSafety(url: string): Promise<{
  isSafe: boolean;
  threatType?: string;
  platformType?: string;
  threatEntryType?: string;
}> {
  try {
    // Call our API endpoint that wraps the Google Safe Browsing API
    const response = await fetch('/api/url/check-safety', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      // If the API call fails, assume the URL is safe to avoid blocking legitimate content
      console.error('Error checking URL safety:', await response.text());
      return { isSafe: true };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking URL safety:', error);
    // If there's an error, assume the URL is safe to avoid blocking legitimate content
    return { isSafe: true };
  }
}

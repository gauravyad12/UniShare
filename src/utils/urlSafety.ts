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
    // Handle both client and server environments
    let apiUrl = '/api/url/check-safety';

    // In client-side environment, use absolute URL from window.location
    if (typeof window !== 'undefined') {
      apiUrl = `${window.location.origin}/api/url/check-safety`;
    }
    // In server environment, use fallbacks in the specified order
    else {
      // Fallback order: unishare.app, localhost, NEXT_PUBLIC_SITE_URL
      const baseUrl = 'https://unishare.app';

      // For local development (if detected)
      if (process.env.NODE_ENV === 'development') {
        apiUrl = 'http://localhost:3000/api/url/check-safety';
      }
      // Use NEXT_PUBLIC_SITE_URL as last resort if available
      else if (process.env.NEXT_PUBLIC_SITE_URL) {
        apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/url/check-safety`;
      }
      // Default to unishare.app
      else {
        apiUrl = `${baseUrl}/api/url/check-safety`;
      }
    }

    const response = await fetch(apiUrl, {
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

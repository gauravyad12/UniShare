/**
 * Get the base URL for the application
 * Uses environment variables to determine the correct URL
 */
export function getBaseUrl(): string {
  // Check for custom domain environment variable first
  if (process.env.NEXT_PUBLIC_DOMAIN) {
    return `https://${process.env.NEXT_PUBLIC_DOMAIN}`;
  }
  
  // Check for Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Default to development or production URL
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:${process.env.PORT || 3000}`;
  }
  
  // Production URL from environment variable
  return `https://${process.env.NEXT_PUBLIC_DOMAIN}`;
} 
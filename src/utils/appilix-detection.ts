/**
 * Helper function to check if the current view is mobile
 * @returns boolean - true if the window width is less than 768px (mobile view)
 */
function isMobileView(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth < 768; // Common breakpoint for mobile devices
}

/**
 * Utility function to detect if the current environment is Appilix or a development environment
 *
 * @returns boolean - true if:
 *   1. The user agent contains "Appilix", OR
 *   2. The domain includes localhost or "192." AND the website is in mobile view
 */
export function isAppilixOrDevelopment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check if user agent contains "Appilix"
  const isAppilix = navigator.userAgent.includes('Appilix');

  // Check if domain includes localhost or 192.
  const isDevelopment =
    window.location.hostname.includes('localhost') ||
    window.location.hostname.includes('192.');

  // If it's Appilix, always return true
  if (isAppilix) {
    return true;
  }

  // If it's a development environment, only return true if in mobile view
  if (isDevelopment) {
    return isMobileView();
  }

  // Otherwise, return false
  return false;
}

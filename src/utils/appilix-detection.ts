/**
 * Utility function to detect if the current environment is Appilix or a development environment
 * 
 * @returns boolean - true if the user agent contains "Appilix" or if the domain includes localhost or "192."
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
  
  return isAppilix || isDevelopment;
}

/**
 * Email normalization utility to prevent multiple registrations with variations of the same email
 * Handles:
 * 1. Case sensitivity (converts to lowercase)
 * 2. Period/dot placement variations in Gmail (removes dots)
 * 3. Tag/label variations (removes everything after +, -, or _)
 */

/**
 * Normalizes an email address to prevent multiple registrations with variations
 * @param email The email address to normalize
 * @returns The normalized email address
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  
  // Convert to lowercase (handles case sensitivity)
  let normalized = email.toLowerCase();
  
  // Split into local part and domain
  const [localPart, domain] = normalized.split('@');
  
  if (!localPart || !domain) return normalized;
  
  let normalizedLocal = localPart;
  
  // Handle Gmail-specific normalization (remove dots)
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Remove dots from local part
    normalizedLocal = localPart.replace(/\./g, '');
  }
  
  // Handle tag/label variations (for all email providers)
  // Remove everything after these common delimiters: +, -, _
  normalizedLocal = normalizedLocal.split(/[+\-_]/)[0];
  
  return `${normalizedLocal}@${domain}`;
}

/**
 * Checks if an email has variations that would normalize to the same address
 * @param email The email address to check
 * @returns An object with the normalized email and whether variations were detected
 */
export function detectEmailVariations(email: string): { 
  normalized: string; 
  hasVariations: boolean;
  originalEmail: string;
} {
  const originalEmail = email;
  const normalized = normalizeEmail(email);
  
  // Check if normalization changed the email
  const hasVariations = normalized !== email.toLowerCase();
  
  return {
    normalized,
    hasVariations,
    originalEmail
  };
}

/**
 * Checks if an email contains Gmail dot variations
 * @param email The email address to check
 * @returns Whether the email contains Gmail dot variations
 */
export function hasGmailDotVariations(email: string): boolean {
  if (!email) return false;
  
  const [localPart, domain] = email.toLowerCase().split('@');
  
  if (!localPart || !domain) return false;
  
  // Only check Gmail domains
  if (domain !== 'gmail.com' && domain !== 'googlemail.com') return false;
  
  // Check if there are dots in the local part
  return localPart.includes('.');
}

/**
 * Checks if an email contains tag/label variations
 * @param email The email address to check
 * @returns Whether the email contains tag/label variations
 */
export function hasTagVariations(email: string): boolean {
  if (!email) return false;
  
  const [localPart] = email.toLowerCase().split('@');
  
  if (!localPart) return false;
  
  // Check if there are tag delimiters in the local part
  return /[+\-_]/.test(localPart);
}

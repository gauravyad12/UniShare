// A utility for checking and filtering bad words in user input

// This is a basic list of common offensive words
// In a production environment, you might want to use a more comprehensive list
// or a third-party service for content moderation
const badWords = [
  'ass',
  'asshole',
  'bastard',
  'bitch',
  'bullshit',
  'cunt',
  'damn',
  'dick',
  'douchebag',
  'fag',
  'faggot',
  'fuck',
  'fucking',
  'nigga',
  'nigger',
  'piss',
  'pussy',
  'shit',
  'slut',
  'whore',
  // Add more words as needed
];

/**
 * Checks if a string contains any bad words, including when embedded within other text
 * @param text The text to check
 * @returns True if the text contains bad words, false otherwise
 */
export function containsBadWords(text: string | null | undefined): boolean {
  if (!text) return false;

  const lowerText = text.toLowerCase();

  // Check for bad words anywhere in the text (not just at word boundaries)
  return badWords.some(word => lowerText.includes(word));
}

/**
 * Gets the first bad word found in a string, including when embedded within other text
 * @param text The text to check
 * @returns The first bad word found, or null if none
 */
export function getFirstBadWord(text: string | null | undefined): string | null {
  if (!text) return null;

  const lowerText = text.toLowerCase();

  for (const word of badWords) {
    if (lowerText.includes(word)) {
      return word;
    }
  }

  return null;
}

/**
 * Censors bad words in a string by replacing them with asterisks
 * @param text The text to censor
 * @returns The censored text
 */
export function censorBadWords(text: string | null | undefined): string {
  if (!text) return '';

  let censoredText = text;

  badWords.forEach(word => {
    // Create a regex that finds the word anywhere in the text, case-insensitive
    const regex = new RegExp(word, 'gi');
    censoredText = censoredText.replace(regex, '*'.repeat(word.length));
  });

  return censoredText;
}

/**
 * Validates text input for bad words
 * @param text The text to validate
 * @param fieldName The name of the field being validated (for error message)
 * @returns An error message if bad words are found, or null if the text is clean
 */
export function validateText(text: string | null | undefined, fieldName: string): string | null {
  const badWord = getFirstBadWord(text);
  if (badWord) {
    return `${fieldName} contains inappropriate language. Please revise.`;
  }
  return null;
}

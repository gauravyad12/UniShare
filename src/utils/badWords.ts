// A utility for checking and filtering bad words in user input
import { createClient } from '@/utils/supabase/client';

// Cache for bad words to avoid repeated database calls
let cachedBadWords: string[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetches bad words from the database
 * @returns Array of bad words
 */
async function fetchBadWords(): Promise<string[]> {
  // If we have cached words and the cache hasn't expired, use them
  const now = Date.now();
  if (cachedBadWords && now - lastFetchTime < CACHE_DURATION) {
    return cachedBadWords;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('bad_words')
      .select('word');

    if (error) {
      console.error('Error fetching bad words:', error);
      // Fallback to empty array if there's an error
      return [];
    }

    // Extract words from the data
    const words = data.map(item => item.word.toLowerCase());

    // Update cache
    cachedBadWords = words;
    lastFetchTime = now;

    return words;
  } catch (error) {
    console.error('Error fetching bad words:', error);
    return [];
  }
}

/**
 * Checks if a string contains any bad words, including when embedded within other text
 * @param text The text to check
 * @returns True if the text contains bad words, false otherwise
 */
export async function containsBadWords(text: string | null | undefined): Promise<boolean> {
  if (!text) return false;

  const lowerText = text.toLowerCase();
  const badWords = await fetchBadWords();

  // Check for bad words anywhere in the text (not just at word boundaries)
  return badWords.some(word => lowerText.includes(word));
}

/**
 * Gets the first bad word found in a string, including when embedded within other text
 * @param text The text to check
 * @returns The first bad word found, or null if none
 */
export async function getFirstBadWord(text: string | null | undefined): Promise<string | null> {
  if (!text) return null;

  const lowerText = text.toLowerCase();
  const badWords = await fetchBadWords();

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
export async function censorBadWords(text: string | null | undefined): Promise<string> {
  if (!text) return '';

  let censoredText = text;
  const badWords = await fetchBadWords();

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
export async function validateText(text: string | null | undefined, fieldName: string): Promise<string | null> {
  const badWord = await getFirstBadWord(text);
  if (badWord) {
    return `${fieldName} contains inappropriate language. Please revise.`;
  }
  return null;
}

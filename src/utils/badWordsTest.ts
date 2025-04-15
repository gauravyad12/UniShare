// A simple test file for the bad words utility
import { containsBadWords, getFirstBadWord, censorBadWords } from './badWords';

// Test cases
const testCases = [
  { input: 'This is a clean text', expected: false },
  { input: 'This has a bad word: fuck', expected: true },
  { input: 'This has an embedded bad word: helloFUCKworld', expected: true },
  { input: 'This has a bad word with different case: FuCk', expected: true },
  { input: 'dhdbadworddkjsjhf', expected: false }, // No actual bad word
  { input: 'dhdshitdkjsjhf', expected: true }, // Bad word embedded
  { input: 'SHIT is not allowed', expected: true },
  { input: 'sh1t with number', expected: false }, // Not detected (would need more complex rules)
];

// Run tests
console.log('Testing containsBadWords:');
testCases.forEach((test, index) => {
  const result = containsBadWords(test.input);
  console.log(`Test ${index + 1}: "${test.input}" => ${result} (Expected: ${test.expected})`);
  console.log(`  Detected word: ${getFirstBadWord(test.input) || 'None'}`);
  console.log(`  Censored: ${censorBadWords(test.input)}`);
});

// Improved script to import chapters and problems for each textbook one at a time
// With better error handling, duplicate detection, and retry logic
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://ncvinrzllkqlypnyluco.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdmlucnpsbGtxbHlwbnlsdWNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjE3MjEwMywiZXhwIjoyMDU3NzQ4MTAzfQ.DMqLq_T9dff2-FZqPjMQeOcjuMy5nqCyFd6JwUUmGv4';

// Initialize Supabase client with longer timeout
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { timeout: 60000 } // 60 second timeout
});

// Load the JSON data
const booksData = JSON.parse(fs.readFileSync(path.join(__dirname, '../unified_books.json'), 'utf8'));

// Configuration
const MAX_PROBLEMS_PER_CHAPTER = 10; // Limit the number of problems per chapter
const MAX_BOOKS = 1004; // Process all books
const DELAY_BETWEEN_BOOKS = 500; // 500ms delay between books (reduced)
const DELAY_BETWEEN_CHAPTERS = 100; // 100ms delay between chapters (reduced)
const MAX_RETRIES = 2; // Maximum number of retries for network errors (reduced)
const RETRY_DELAY = 1000; // 1 second delay before retrying (reduced)
const PROBLEMS_BATCH_SIZE = 5; // Insert problems in small batches

// Save progress to a file so we can resume if the script crashes
const PROGRESS_FILE = path.join(__dirname, 'import-progress.json');

// Function to load progress from file
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
      console.log(`Loaded progress: Last processed book index ${progress.lastBookIndex}`);
      return progress;
    }
  } catch (error) {
    console.error('Error loading progress file:', error);
  }
  return { lastBookIndex: -1, processedBooks: {} };
}

// Function to save progress to file
function saveProgress(progress) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (error) {
    console.error('Error saving progress file:', error);
  }
}

// Helper function to retry operations with a simple delay
async function withRetry(operation, maxRetries = MAX_RETRIES, delay = RETRY_DELAY) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        console.error(`Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`All ${maxRetries} attempts failed:`, error.message || error);
      }
    }
  }

  return { error: lastError }; // Return error object instead of throwing
}

// Function to split array into chunks of specified size
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Function to import chapters and problems for a single textbook
async function importTextbookData(book, progress) {
  try {
    console.log(`Processing textbook: ${book.name} (ISBN: ${book.isbn})`);

    // Skip if this book has already been processed
    if (progress.processedBooks[book.isbn]) {
      console.log(`Skipping already processed book: ${book.name}`);
      return true;
    }

    // Get the textbook ID from the database
    const { data: textbook, error: textbookError } = await withRetry(async () => {
      return await supabase
        .from('textbooks')
        .select('id')
        .eq('isbn', book.isbn)
        .single();
    });

    if (textbookError) {
      console.error(`Error getting textbook with ISBN ${book.isbn}:`, textbookError);
      return false;
    }

    const textbookId = textbook.id;
    console.log(`Found textbook ID: ${textbookId}`);

    // Get the chapters for this textbook
    const chapters = Object.keys(book.solutions);
    console.log(`Found ${chapters.length} chapters for this textbook`);

    let successfulChapters = 0;

    // Insert chapters one by one
    for (const chapterKey of chapters) {
      try {
        // Insert chapter
        const { data: chapter, error: chapterError } = await withRetry(async () => {
          return await supabase
            .from('textbook_chapters')
            .upsert({
              textbook_id: textbookId,
              chapter_number: chapterKey
            })
            .select('id')
            .single();
        });

        if (chapterError) {
          console.error(`Error inserting chapter ${chapterKey}:`, chapterError);
          continue;
        }

        const chapterId = chapter.id;

        // Get problems for this chapter
        const problems = book.solutions[chapterKey];

        // Limit the number of problems per chapter
        const limitedProblems = problems.slice(0, MAX_PROBLEMS_PER_CHAPTER);

        console.log(`Inserting up to ${limitedProblems.length} problems for chapter ${chapterKey} (out of ${problems.length} total)`);

        // Prepare problem data
        const problemData = limitedProblems.map(problem => ({
          chapter_id: chapterId,
          problem_number: problem.problem,
          solution_url: problem.link
        }));

        // Split problems into smaller batches
        const batches = chunkArray(problemData, PROBLEMS_BATCH_SIZE);

        let insertedCount = 0;
        let errorCount = 0;

        // Insert problems in small batches
        for (const batch of batches) {
          try {
            // Insert batch with upsert to handle duplicates automatically
            const { error: batchError } = await withRetry(async () => {
              return await supabase
                .from('textbook_problems')
                .upsert(batch, { onConflict: 'chapter_id,problem_number' });
            });

            if (batchError) {
              console.error(`Error inserting batch for chapter ${chapterKey}:`, batchError);
              errorCount += batch.length;
            } else {
              insertedCount += batch.length;
            }
          } catch (error) {
            console.error(`Error processing batch for chapter ${chapterKey}:`, error);
            errorCount += batch.length;
          }
        }

        console.log(`Chapter ${chapterKey}: Processed ${insertedCount} problems, errors: ${errorCount}`);
        successfulChapters++;

        // Add a small delay between chapters to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHAPTERS));
      } catch (error) {
        console.error(`Error processing chapter ${chapterKey}:`, error);
      }
    }

    // Mark this book as processed
    progress.processedBooks[book.isbn] = true;
    saveProgress(progress);

    console.log(`Successfully processed textbook: ${book.name} (${successfulChapters}/${chapters.length} chapters)`);
    return true;
  } catch (error) {
    console.error(`Error processing textbook ${book.isbn}:`, error);
    return false;
  }
}

// Main function to import data
async function importData() {
  try {
    console.log('Starting import of chapters and problems...');

    // Load progress from file
    const progress = loadProgress();
    let startIndex = progress.lastBookIndex + 1;

    let successCount = 0;
    let errorCount = 0;

    // Process books one by one
    for (let i = startIndex; i < Math.min(booksData.length, MAX_BOOKS); i++) {
      const book = booksData[i];

      console.log(`\nProcessing book ${i + 1}/${Math.min(booksData.length, MAX_BOOKS)}`);

      const success = await importTextbookData(book, progress);

      if (success) {
        successCount++;
      } else {
        errorCount++;
      }

      // Update progress
      progress.lastBookIndex = i;
      saveProgress(progress);

      // Add a delay between books to avoid rate limiting
      if (i < Math.min(booksData.length, MAX_BOOKS) - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BOOKS));
      }
    }

    console.log(`\nImport completed. Successfully processed ${successCount} books. Errors: ${errorCount}`);
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Run the import function
importData()
  .catch(error => {
    console.error('Unhandled error:', error);
  })
  .finally(() => {
    console.log('Import script finished');
  });

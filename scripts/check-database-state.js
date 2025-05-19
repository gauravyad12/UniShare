// Script to check the current state of the database
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://ncvinrzllkqlypnyluco.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdmlucnpsbGtxbHlwbnlsdWNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjE3MjEwMywiZXhwIjoyMDU3NzQ4MTAzfQ.DMqLq_T9dff2-FZqPjMQeOcjuMy5nqCyFd6JwUUmGv4';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to check the current state of the database
async function checkDatabaseState() {
  try {
    console.log('Checking the current state of the database...');
    
    // Count textbooks
    const { data: textbooks, error: textbooksError } = await supabase
      .from('textbooks')
      .select('id', { count: 'exact' });
    
    if (textbooksError) {
      console.error('Error counting textbooks:', textbooksError);
    } else {
      console.log(`Number of textbooks in the database: ${textbooks.length}`);
    }
    
    // Count chapters
    const { data: chapters, error: chaptersError } = await supabase
      .from('textbook_chapters')
      .select('id', { count: 'exact' });
    
    if (chaptersError) {
      console.error('Error counting chapters:', chaptersError);
    } else {
      console.log(`Number of chapters in the database: ${chapters.length}`);
    }
    
    // Count problems
    const { data: problems, error: problemsError } = await supabase
      .from('textbook_problems')
      .select('id', { count: 'exact' });
    
    if (problemsError) {
      console.error('Error counting problems:', problemsError);
    } else {
      console.log(`Number of problems in the database: ${problems.length}`);
    }
    
    // Get a sample of textbooks
    const { data: sampleTextbooks, error: sampleError } = await supabase
      .from('textbooks')
      .select('isbn, title, author')
      .limit(5);
    
    if (sampleError) {
      console.error('Error getting sample textbooks:', sampleError);
    } else {
      console.log('\nSample textbooks:');
      sampleTextbooks.forEach(textbook => {
        console.log(`- ${textbook.title} by ${textbook.author} (ISBN: ${textbook.isbn})`);
      });
    }
  } catch (error) {
    console.error('Unexpected error checking database state:', error);
  }
}

// Run the check function
checkDatabaseState()
  .catch(error => {
    console.error('Error in checkDatabaseState function:', error);
  })
  .finally(() => {
    console.log('\nDatabase check completed');
  });

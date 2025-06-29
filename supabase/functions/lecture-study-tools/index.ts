import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface LectureStudyRequest {
  operation: 'flashcards' | 'quiz' | 'summary' | 'notes';
  jobId: string;
  userId: string;
  recordingIds: string[];
  // Flashcards params
  difficulty?: string;
  count?: number;
  // Quiz params
  questionCount?: number;
  questionTypes?: string[];
  quizDifficulty?: string;
  // Summary params
  summaryType?: string;
  // Notes params
  style?: string;
}

interface LectureStudyResponse {
  success: boolean;
  result?: any;
  error?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const requestData: LectureStudyRequest = await req.json();
    const { operation, jobId, userId, recordingIds } = requestData;

    console.log('Lecture Study Tools Edge Function called:', {
      operation,
      jobId,
      userId,
      recordingIds,
      recordingCount: recordingIds?.length || 0
    });

    // Validate required fields
    if (!operation || !jobId || !userId || !recordingIds || recordingIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: operation, jobId, userId, recordingIds' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update job status to processing
    try {
      await supabase
        .from('lecture_study_tools')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      console.log(`Updated job ${jobId} status to processing`);
    } catch (error) {
      console.error('Failed to update job status to processing:', error);
    }

    // Get lecture recordings content
    const { data: recordings, error: recordingsError } = await supabase
      .from('lecture_recordings')
      .select('id, title, transcript')
      .in('id', recordingIds)
      .eq('user_id', userId);

    if (recordingsError || !recordings || recordings.length === 0) {
      throw new Error('No valid recordings found');
    }

    // Filter recordings with transcripts
    const recordingsWithTranscripts = recordings.filter(r => r.transcript && r.transcript.trim().length > 0);
    if (recordingsWithTranscripts.length === 0) {
      throw new Error('No recordings with transcripts found');
    }

    console.log(`Processing ${recordingsWithTranscripts.length} recordings for ${operation}`);

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let result: any;

    // Process based on operation type
    switch (operation) {
      case 'flashcards':
        result = await generateFlashcards(recordingsWithTranscripts, requestData.difficulty || 'medium', requestData.count || 10, openaiApiKey);
        break;
      case 'quiz':
        result = await generateQuiz(recordingsWithTranscripts, requestData.questionCount || 10, requestData.questionTypes || ['multiple-choice', 'true-false', 'short-answer'], requestData.quizDifficulty || 'medium', openaiApiKey);
        break;
      case 'summary':
        result = await generateSummary(recordingsWithTranscripts, requestData.summaryType || 'comprehensive', openaiApiKey);
        break;
      case 'notes':
        result = await generateNotes(recordingsWithTranscripts, requestData.style || 'structured', openaiApiKey);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    // Update job status to completed
    try {
      await supabase
        .from('lecture_study_tools')
        .update({ 
          status: 'completed',
          result: result,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      console.log(`Updated job ${jobId} status to completed`);
    } catch (error) {
      console.error('Failed to update job status to completed:', error);
    }

    const response: LectureStudyResponse = {
      success: true,
      result
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (processingError) {
    console.error('Lecture study tools processing error:', processingError);
    
    const errorMessage = processingError instanceof Error ? processingError.message : 'Processing failed';
    
    // Get request data for cleanup (if available)
    let jobId: string | undefined;
    
    try {
      const requestData = await req.clone().json();
      jobId = requestData.jobId;
    } catch {
      // Ignore if we can't parse request data
    }
    
    // Initialize Supabase client for error handling
    const authHeader = req.headers.get('Authorization');
    if (authHeader && jobId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: authHeader } }
        });

        // Update job status to failed
        await supabase
          .from('lecture_study_tools')
          .update({ 
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
        console.log(`Updated job ${jobId} status to failed`);
      } catch (dbError) {
        console.error('Failed to update job status to failed:', dbError);
      }
    }

    const response: LectureStudyResponse = {
      success: false,
      error: errorMessage
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});

// Generate flashcards from lecture transcripts
async function generateFlashcards(recordings: any[], difficulty: string, count: number, openaiApiKey: string) {
  console.log(`Generating ${count} ${difficulty} flashcards from ${recordings.length} recordings`);
  
  // Combine all transcripts
  const combinedContent = recordings.map(r => `## ${r.title}\n${r.transcript}`).join('\n\n');
  
  const prompt = `Based on the following lecture transcripts, create ${count} flashcards at ${difficulty} difficulty level.

Content:
${combinedContent}

Please create flashcards that:
- Test key concepts, definitions, and important details from the lectures
- Are appropriate for ${difficulty} difficulty level
- Cover different topics mentioned in the transcripts
- Have clear, concise questions and accurate answers

Return the flashcards as a JSON array with this exact format:
{
  "flashcards": [
    {
      "id": "1",
      "question": "Question text here",
      "answer": "Answer text here",
      "category": "Category name"
    }
  ]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator who creates high-quality flashcards for students. Always respond with valid JSON in the exact format requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content generated from OpenAI');
  }

  try {
    const result = JSON.parse(content);
    console.log(`Generated ${result.flashcards?.length || 0} flashcards`);
    return result;
  } catch (parseError) {
    console.error('Failed to parse flashcards JSON:', content);
    throw new Error('Failed to generate valid flashcards format');
  }
}

// Generate quiz from lecture transcripts
async function generateQuiz(recordings: any[], questionCount: number, questionTypes: string[], difficulty: string, openaiApiKey: string) {
  console.log(`Generating ${questionCount} question quiz (${difficulty}) from ${recordings.length} recordings`);
  
  // Combine all transcripts
  const combinedContent = recordings.map(r => `## ${r.title}\n${r.transcript}`).join('\n\n');
  
  const prompt = `Based on the following lecture transcripts, create a ${questionCount}-question quiz at ${difficulty} difficulty level.

Content:
${combinedContent}

Question types to include: ${questionTypes.join(', ')}

Please create a quiz that:
- Tests understanding of key concepts from the lectures
- Is appropriate for ${difficulty} difficulty level
- Uses the specified question types
- Has clear, unambiguous questions and correct answers

Return the quiz as a JSON object with this exact format:
{
  "title": "Quiz Title",
  "description": "Brief description",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": "1",
      "type": "multiple-choice",
      "question": "Question text",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswer": "Option A text",
      "explanation": "Why this answer is correct"
    },
    {
      "id": "2", 
      "type": "true-false",
      "question": "True/false question",
      "correctAnswer": "True",
      "explanation": "Explanation"
    },
    {
      "id": "3",
      "type": "short-answer", 
      "question": "Short answer question",
      "correctAnswer": "Expected answer",
      "explanation": "Explanation"
    }
  ]
}

IMPORTANT FORMATTING RULES:
- For multiple-choice questions: "correctAnswer" must be the EXACT TEXT of the correct option, not an index number
- For true-false questions: "correctAnswer" must be either "True" or "False" as a string, not a boolean
- For short-answer questions: "correctAnswer" should be the expected text answer
- All questions must have unique string IDs
- All explanations should be clear and educational`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator who creates comprehensive quizzes for students. Always respond with valid JSON in the exact format requested. CRITICAL: For multiple-choice questions, the "correctAnswer" field must contain the EXACT TEXT of the correct option, not an index number. For true-false questions, use "True" or "False" as strings, not booleans.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content generated from OpenAI');
  }

  try {
    const result = JSON.parse(content);
    console.log(`Generated quiz with ${result.questions?.length || 0} questions`);
    return result;
  } catch (parseError) {
    console.error('Failed to parse quiz JSON:', content);
    throw new Error('Failed to generate valid quiz format');
  }
}

// Generate summary from lecture transcripts
async function generateSummary(recordings: any[], summaryType: string, openaiApiKey: string) {
  console.log(`Generating ${summaryType} summary from ${recordings.length} recordings`);
  
  // Combine all transcripts
  const combinedContent = recordings.map(r => `## ${r.title}\n${r.transcript}`).join('\n\n');
  
  const prompt = `Please create a comprehensive summary of the following lecture transcripts:

Content:
${combinedContent}

Create a well-structured summary and return it as a JSON object with the following format:

{
  "title": "Summary title",
  "overview": "Brief overview paragraph",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "likelyTestTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "commonMistakes": ["Common mistake 1", "Common mistake 2"],
  "studyTips": ["Study tip 1", "Study tip 2", "Study tip 3"]
}

Requirements:
- title: Create a descriptive title for the summary
- overview: Write a 2-3 sentence overview of the main content
- keyPoints: Extract 5-8 key points from the lectures (each as a string)
- likelyTestTopics: Identify 3-5 topics likely to appear on tests
- commonMistakes: List 2-4 common mistakes students might make
- studyTips: Provide 3-5 specific study tips for this material

Ensure all arrays contain strings, not objects. Return only valid JSON.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert academic writer who creates comprehensive, well-organized summaries of educational content. Always respond with valid JSON in the exact format requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content generated from OpenAI');
  }

  try {
    const result = JSON.parse(content);
    console.log(`Generated summary with title: ${result.title}`);
    return result;
  } catch (parseError) {
    console.error('Failed to parse summary JSON:', content);
    throw new Error('Failed to generate valid summary format');
  }
}

// Generate notes from lecture transcripts
async function generateNotes(recordings: any[], style: string, openaiApiKey: string) {
  console.log(`Generating ${style} notes from ${recordings.length} recordings`);
  
  // Combine all transcripts
  const combinedContent = recordings.map(r => `## ${r.title}\n${r.transcript}`).join('\n\n');
  
  let stylePrompt = '';
  switch (style) {
    case 'outline':
      stylePrompt = 'Create detailed outline-style notes with hierarchical bullet points and clear organization.';
      break;
    case 'cornell':
      stylePrompt = 'Create Cornell-style notes with main content, key points/questions, and summary sections.';
      break;
    case 'mindmap':
      stylePrompt = 'Create mind map style notes showing relationships between concepts with central topics and connected subtopics.';
      break;
    default:
      stylePrompt = 'Create well-structured, comprehensive study notes organized by topic with clear headings and bullet points.';
  }
  
  const prompt = `Please create detailed study notes from the following lecture transcripts:

Content:
${combinedContent}

${stylePrompt}

Return the notes as a JSON object with the following format:

{
  "title": "Notes title",
  "sections": [
    {
      "title": "Section 1 Title",
      "content": "Main content for this section",
      "keyPoints": ["Key point 1", "Key point 2"],
      "examples": ["Example 1", "Example 2"]
    },
    {
      "title": "Section 2 Title", 
      "content": "Main content for this section",
      "keyPoints": ["Key point 1", "Key point 2"],
      "examples": ["Example 1"]
    }
  ]
}

Requirements:
- title: Create a descriptive title for the notes
- sections: Break content into logical sections (3-6 sections)
- Each section should have a clear title and main content
- keyPoints: 2-4 key points per section (optional, can be empty array)
- examples: Relevant examples for each section (optional, can be empty array)

Ensure all content is well-organized and suitable for studying. Return only valid JSON.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert note-taker who creates excellent study materials for students from lecture content. Always respond with valid JSON in the exact format requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content generated from OpenAI');
  }

  try {
    const result = JSON.parse(content);
    console.log(`Generated notes with title: ${result.title}`);
    return result;
  } catch (parseError) {
    console.error('Failed to parse notes JSON:', content);
    throw new Error('Failed to generate valid notes format');
  }
} 
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface DocumentStudyRequest {
  operation: 'flashcards' | 'quiz' | 'summary' | 'notes';
  jobId: string;
  userId: string;
  documentIds: string[];
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

interface DocumentStudyResponse {
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

    const requestData: DocumentStudyRequest = await req.json();
    const { operation, jobId, userId, documentIds } = requestData;

    console.log('Document Study Tools Edge Function called:', {
      operation,
      jobId,
      userId,
      documentIds,
      documentCount: documentIds?.length || 0
    });

    // Validate required fields
    if (!operation || !jobId || !userId || !documentIds || documentIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: operation, jobId, userId, documentIds' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update job status to processing
    try {
      await supabase
        .from('document_study_jobs')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      console.log(`Updated job ${jobId} status to processing`);
    } catch (error) {
      console.error('Failed to update job status to processing:', error);
    }

    // Get documents content
    const { data: documents, error: documentsError } = await supabase
      .from('document_chat_documents')
      .select('id, name, content, text_chunks')
      .in('id', documentIds)
      .eq('user_id', userId)
      .eq('status', 'ready');

    if (documentsError || !documents || documents.length === 0) {
      throw new Error('No valid documents found');
    }

    console.log(`Processing ${documents.length} documents for ${operation}`);

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let result: any;

    // Process based on operation type
    switch (operation) {
      case 'flashcards':
        result = await generateFlashcards(documents, requestData.difficulty || 'medium', requestData.count || 10, openaiApiKey);
        break;
      case 'quiz':
        result = await generateQuiz(documents, requestData.questionCount || 10, requestData.questionTypes || ['multiple-choice', 'true-false', 'short-answer'], requestData.quizDifficulty || 'medium', openaiApiKey);
        break;
      case 'summary':
        result = await generateSummary(documents, requestData.summaryType || 'comprehensive', openaiApiKey);
        break;
      case 'notes':
        result = await generateNotes(documents, requestData.style || 'structured', openaiApiKey);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    // Update job status to completed
    try {
      await supabase
        .from('document_study_jobs')
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

    const response: DocumentStudyResponse = {
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
    console.error('Document study tools processing error:', processingError);
    
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
          .from('document_study_jobs')
          .update({ 
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
        console.log(`Updated job ${jobId} status to failed`);
      } catch (cleanupError) {
        console.error('Failed to update error status:', cleanupError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});

// Flashcards generation function
async function generateFlashcards(documents: any[], difficulty: string, count: number, openaiApiKey: string) {
  const combinedContent = documents.map(doc => 
    `Document: ${doc.name}\n${doc.content}`
  ).join('\n\n');

  const difficultyInstructions = {
    easy: 'Create basic, straightforward flashcards focusing on definitions and simple concepts.',
    medium: 'Create moderately challenging flashcards that test understanding and application of concepts.',
    hard: 'Create advanced flashcards that test deep understanding, analysis, and synthesis of concepts.'
  };

  const systemPrompt = `You are an expert educator creating study flashcards from document content. 

Instructions:
- Generate exactly ${count} flashcards
- Difficulty level: ${difficulty} - ${difficultyInstructions[difficulty as keyof typeof difficultyInstructions] || difficultyInstructions.medium}
- Focus on the most important concepts, facts, and ideas
- Create clear, concise questions and comprehensive answers
- Include diverse question types: definitions, explanations, examples, applications
- Ensure each flashcard tests a distinct concept
- Format as JSON array with "question" and "answer" fields

Document content:
${combinedContent.slice(0, 15000)}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate ${count} flashcards at ${difficulty} difficulty level.` }
      ],
      max_tokens: 3000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  const flashcardsData = JSON.parse(result.choices[0].message.content);
  
  return { flashcards: flashcardsData.flashcards || [] };
}

// Quiz generation function
async function generateQuiz(documents: any[], questionCount: number, questionTypes: string[], difficulty: string, openaiApiKey: string) {
  const combinedContent = documents.map(doc => 
    `Document: ${doc.name}\n${doc.content}`
  ).join('\n\n');

  const difficultyInstructions = {
    easy: 'Create basic questions focusing on simple recall of facts, definitions, and basic concepts. Questions should be straightforward and test fundamental understanding.',
    medium: 'Create moderate difficulty questions that test comprehension and application of concepts. Include some analysis but keep questions accessible.',
    hard: 'Create challenging questions that require critical thinking, analysis, synthesis, and evaluation. Test deep understanding and complex relationships between concepts.'
  };

  const systemPrompt = `You are an expert educator creating a practice quiz from document content.

Instructions:
- Generate exactly ${questionCount} questions
- Use these question types: ${questionTypes.join(', ')}
- Distribute questions evenly across the specified types
- Difficulty level: ${difficulty} - ${difficultyInstructions[difficulty as keyof typeof difficultyInstructions] || difficultyInstructions.medium}
- Focus on key concepts, facts, and ideas from the documents
- For multiple-choice: provide 4 options with one correct answer (do not include letter prefixes like A, B, C, D)
- For true-false: provide clear statements that can be definitively true or false
- For short-answer: create questions that require 1-3 sentence responses
- Include detailed explanations for all correct answers
- Ensure questions test different levels of understanding (recall, comprehension, application, analysis)

Format as JSON with this structure:
{
  "title": "Practice Quiz",
  "questions": [
    {
      "id": "1",
      "type": "multiple-choice|true-false|short-answer",
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"] (for multiple-choice only),
      "correctAnswer": "A" (or "true"/"false" or sample answer),
      "explanation": "Detailed explanation of why this is correct"
    }
  ]
}

Document content:
${combinedContent.slice(0, 15000)}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a ${questionCount}-question quiz using the specified question types.` }
      ],
      max_tokens: 4000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  const quizData = JSON.parse(result.choices[0].message.content);
  
  // Add difficulty metadata to the quiz result
  quizData.difficulty = difficulty;
  
  console.log(`Generated quiz with difficulty: ${difficulty}`, {
    title: quizData.title,
    questionCount: quizData.questions?.length,
    difficulty: quizData.difficulty
  });
  
  return quizData;
}

// Summary generation function
async function generateSummary(documents: any[], summaryType: string, openaiApiKey: string) {
  const combinedContent = documents.map(doc => 
    `Document: ${doc.name}\n${doc.content}`
  ).join('\n\n');

  const documentNames = documents.map(doc => doc.name).join(', ');

  const systemPrompt = `You are an expert academic summarizer. Create a comprehensive study summary from the provided documents.

Your summary should include:

1. **Brief Overview**: A concise 2-3 paragraph summary of the main topic and scope
2. **Key Points**: 8-12 most important concepts, facts, or ideas (as bullet points)
3. **Likely Test Topics**: 6-10 areas that would likely appear on exams or assessments
4. **Common Mistakes**: 4-6 typical errors students make when learning this material
5. **Study Tips**: 3-5 specific recommendations for mastering this content

Format as JSON with this structure:
{
  "title": "Summary of [document names]",
  "overview": "Brief overview text",
  "keyPoints": ["Point 1", "Point 2", ...],
  "likelyTestTopics": ["Topic 1", "Topic 2", ...],
  "commonMistakes": ["Mistake 1", "Mistake 2", ...],
  "studyTips": ["Tip 1", "Tip 2", ...]
}

Requirements:
- Be comprehensive yet concise
- Focus on academically relevant content
- Highlight relationships between concepts
- Use clear, educational language
- Ensure all sections are substantive and helpful

Document content:
${combinedContent.slice(0, 20000)}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a comprehensive study summary for: ${documentNames}` }
      ],
      max_tokens: 3500,
      temperature: 0.5,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  const summaryData = JSON.parse(result.choices[0].message.content);
  
  return summaryData;
}

// Notes generation function
async function generateNotes(documents: any[], style: string, openaiApiKey: string) {
  const combinedContent = documents.map(doc => 
    `Document: ${doc.name}\n${doc.content}`
  ).join('\n\n');

  const documentNames = documents.map(doc => doc.name).join(', ');

  const styleInstructions = {
    structured: 'Create well-organized notes with clear headings, subheadings, and bullet points',
    outline: 'Create detailed outline-style notes with hierarchical structure',
    cornell: 'Create Cornell note-taking style with main notes, cues, and summary',
    mindmap: 'Create text-based mind map structure showing relationships between concepts'
  };

  const systemPrompt = `You are an expert note-taker creating comprehensive study notes from academic documents.

Style: ${style} - ${styleInstructions[style as keyof typeof styleInstructions] || styleInstructions.structured}

Create detailed, well-organized notes that include:
- All major concepts and key information
- Important definitions and terminology
- Examples and illustrations where relevant
- Relationships between different ideas
- Clear structure and formatting
- Emphasis on study-relevant content

Format as JSON with this structure:
{
  "title": "Study Notes: [document names]",
  "sections": [
    {
      "heading": "Section Title",
      "content": "Detailed notes content with proper formatting",
      "subsections": [
        {
          "subheading": "Subsection Title",
          "points": ["Point 1", "Point 2", ...]
        }
      ]
    }
  ],
  "keyTerms": [
    {
      "term": "Term name",
      "definition": "Definition"
    }
  ],
  "summary": "Brief summary of all content"
}

Requirements:
- Comprehensive coverage of all important material
- Clear, logical organization
- Academic writing style
- Include specific details and examples
- Suitable for study and review

Document content:
${combinedContent.slice(0, 25000)}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate ${style} study notes for: ${documentNames}` }
      ],
      max_tokens: 4000,
      temperature: 0.4,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  const notesData = JSON.parse(result.choices[0].message.content);
  
  return notesData;
} 
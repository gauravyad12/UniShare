import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface EssayRequest {
  operation: 'outline' | 'content' | 'analyze';
  jobId?: string;
  userId: string;
  prompt?: string;
  outline?: string;
  content?: string;
  title?: string;
  essayType: string;
  wordCount: number;
  academicLevel: string;
  citationStyle: string;
  requirements?: string[];
  rubric?: any;
  customRubric?: string;
}

interface EssayResponse {
  success: boolean;
  outline?: string;
  content?: string;
  title?: string;
  feedback?: any;
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

  // Declare variables in outer scope for error handling
  let jobId: string | undefined;
  let supabase: any;

  try {
    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

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
    supabase = createClient(supabaseUrl, supabaseKey, {
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

    // Check if user has Scholar+ access (regular or temporary)
    let hasAccess = false;
    
    // Check regular subscription first
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (subscription) {
      const currentTime = Math.floor(Date.now() / 1000);
      hasAccess = subscription.status === "active" &&
                  (!subscription.current_period_end ||
                   subscription.current_period_end > currentTime);
    }

    // Check temporary access if no regular subscription
    if (!hasAccess) {
      const { data: temporaryAccess } = await supabase
        .from("temporary_scholar_access")
        .select("expires_at")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .maybeSingle();

      hasAccess = !!temporaryAccess;
    }

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Scholar+ subscription required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const requestData: EssayRequest = await req.json();
    const { operation, userId, prompt, outline, content, title, essayType, wordCount, academicLevel, citationStyle, requirements, rubric, customRubric } = requestData;
    jobId = requestData.jobId;

    // Update job status to processing if jobId is provided
    if (jobId) {
      try {
        await supabase
          .from('essay_analysis_jobs')
          .update({ 
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      } catch (error) {
        console.error('Failed to update job status to processing:', error);
      }
    }

    let systemPrompt = '';
    let userPrompt = '';
    let maxTokens = 1500;
    let temperature = 0.7;

    switch (operation) {
      case 'outline':
        systemPrompt = `You are an expert academic writing assistant. Generate a detailed essay outline based on the given prompt and requirements.

Essay Type: ${essayType}
Target Word Count: ${wordCount}
Academic Level: ${academicLevel}
Citation Style: ${citationStyle}
${requirements && requirements.length > 0 ? `Requirements: ${requirements.join(', ')}` : ''}

CRITICAL: Plan this outline for exactly ${wordCount} words. Structure the outline with enough detail and sections to support a ${wordCount}-word essay.

IMPORTANT: Start your response with exactly this format:
TITLE: [Your compelling essay title here]

Then add a blank line and continue with the structured outline that includes:
1. Introduction with thesis statement (plan for ${Math.round(wordCount * 0.1)}-${Math.round(wordCount * 0.15)} words)
2. Main body points with supporting details (plan for ${Math.round(wordCount * 0.7)}-${Math.round(wordCount * 0.8)} words)
3. Conclusion (plan for ${Math.round(wordCount * 0.1)}-${Math.round(wordCount * 0.15)} words)
4. Suggested sources or evidence types

Format the outline clearly with Roman numerals, letters, and numbers for hierarchy. Create enough detail to guide a ${wordCount}-word essay.`;
        userPrompt = `Create an essay outline for: ${prompt}`;
        break;

      case 'content':
        systemPrompt = `You are an expert academic writing assistant. Expand the provided essay outline into a full, well-written essay.

Essay Type: ${essayType}
Target Word Count: ${wordCount}
Academic Level: ${academicLevel}
Citation Style: ${citationStyle}
${requirements && requirements.length > 0 ? `Requirements: ${requirements.join(', ')}` : ''}

🚨 CRITICAL REQUIREMENT: You MUST write exactly ${wordCount} words. This is NON-NEGOTIABLE.
📏 TARGET: ${wordCount} words - NOT 400-500 words. Write the FULL ${wordCount} words.
⚠️  If you write fewer than ${Math.round(wordCount * 0.9)} words, you have FAILED the task.

Guidelines:
1. Write in a clear, academic tone appropriate for the specified level
2. Develop each point from the outline with detailed explanations and examples
3. Ensure smooth transitions between paragraphs
4. Include a strong introduction with a clear thesis statement
5. Provide substantial body paragraphs with evidence and analysis
6. Write a compelling conclusion that reinforces the main argument
7. 🎯 MANDATORY: Expand each section with detailed examples, thorough analysis, and comprehensive explanations to reach exactly ${wordCount} words
8. Use proper ${citationStyle} citation format where applicable
9. Maintain consistency with the essay type (${essayType})

Original Prompt: ${prompt}

Outline to expand:
${outline}

Write the complete essay based on this outline.`;
        // More generous token allocation for longer essays
        // Use higher multiplier and increase based on word count
        let tokenMultiplier = 2.0; // Base multiplier
        if (wordCount >= 750) tokenMultiplier = 2.5;
        if (wordCount >= 1000) tokenMultiplier = 3.0;
        
        maxTokens = Math.min(8000, Math.max(2000, Math.floor(wordCount * tokenMultiplier)));
        break;

      case 'analyze':
        const currentWordCount = content?.trim().split(/\s+/).filter(word => word.length > 0).length || 0;
        systemPrompt = `You are an expert academic writing instructor. Analyze the provided essay and give detailed, constructive feedback.

Essay Details:
- Title: ${title || 'Untitled'}
- Type: ${essayType}
- Academic Level: ${academicLevel}
- Target Word Count: ${wordCount}
- Current Word Count: ${currentWordCount}
${prompt ? `- Original Prompt: ${prompt}` : ''}

Analysis Criteria:
1. Thesis Statement & Argument Clarity
2. Organization & Structure
3. Evidence & Support
4. Writing Style & Tone
5. Grammar & Mechanics
6. Adherence to Prompt/Requirements

${rubric ? `Custom Rubric Criteria: ${JSON.stringify(rubric)}` : ''}

Provide your analysis in the following JSON format:
{
  "overallScore": 85,
  "criteriaScores": {
    "Thesis Statement": {
      "score": 88,
      "feedback": "Clear and arguable thesis statement that effectively addresses the prompt.",
      "suggestions": ["Consider making the thesis more specific", "Add a preview of main arguments"]
    },
    "Organization": {
      "score": 82,
      "feedback": "Good overall structure with clear introduction and conclusion.",
      "suggestions": ["Improve transitions between paragraphs", "Consider reordering some arguments"]
    }
  },
  "strengths": [
    "Strong introduction that engages the reader",
    "Good use of evidence to support arguments",
    "Clear and concise writing style"
  ],
  "improvements": [
    "Some paragraphs could be better developed",
    "Need stronger transitions between ideas",
    "Conclusion could be more impactful"
  ],
  "suggestions": [
    "Add more specific examples to support your arguments",
    "Consider addressing potential counterarguments",
    "Proofread for minor grammatical errors"
  ]
}

Essay to analyze:
${content}`;
        userPrompt = '';
        maxTokens = 2000;
        temperature = 0.3;
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid request type' }),
          { 
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: operation === 'content' ? 'gpt-4o' : 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...(userPrompt ? [{
            role: 'user' as const,
            content: userPrompt
          }] : [])
        ],
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ success: false, error: `OpenAI API error: ${openaiResponse.status}` }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const openaiResult = await openaiResponse.json();
    const generatedText = openaiResult.choices[0]?.message?.content;

    if (!generatedText) {
      return new Response(
        JSON.stringify({ success: false, error: 'No content generated' }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const response: EssayResponse = { success: true };

    switch (operation) {
            case 'outline':
        // Simple title extraction - look for "TITLE: " at the start
        const lines = generatedText.split('\n');
        let extractedTitle = 'Generated Essay';
        let cleanedOutline = generatedText;
        
        // Check if first line starts with "TITLE: "
        if (lines.length > 0 && lines[0].toUpperCase().startsWith('TITLE:')) {
          extractedTitle = lines[0].substring(6).trim(); // Remove "TITLE: " and trim
          // Remove the title line and any following empty lines from outline
          let startIndex = 1;
          while (startIndex < lines.length && lines[startIndex].trim() === '') {
            startIndex++;
          }
          cleanedOutline = lines.slice(startIndex).join('\n').trim();
        }

        response.outline = cleanedOutline;
        response.title = extractedTitle;
        break;

      case 'content':
        response.content = generatedText;
        break;

      case 'analyze':
        try {
          // Try to parse the JSON response
          const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            response.feedback = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (parseError) {
          console.error('Failed to parse analysis JSON:', parseError);
          // Fallback to a structured response
          response.feedback = {
            overallScore: 75,
            criteriaScores: {},
            strengths: [
              "Essay demonstrates understanding of the topic",
              "Writing is generally clear and coherent"
            ],
            improvements: [
              "Consider strengthening the thesis statement",
              "Add more supporting evidence",
              "Improve paragraph transitions"
            ],
            suggestions: [
              "Review the essay structure and organization",
              "Add more specific examples and evidence",
              "Proofread for grammar and style improvements"
            ]
          };
        }

        // Ensure all required fields are present
        if (!response.feedback.overallScore) response.feedback.overallScore = 75;
        if (!response.feedback.criteriaScores) response.feedback.criteriaScores = {};
        if (!response.feedback.strengths) response.feedback.strengths = [];
        if (!response.feedback.improvements) response.feedback.improvements = [];
        if (!response.feedback.suggestions) response.feedback.suggestions = [];
        break;
    }

    // Update job status to completed
    if (jobId) {
      try {
        await supabase
          .from('essay_analysis_jobs')
          .update({ 
            status: 'completed',
            result: response,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
        console.log(`Updated job ${jobId} status to completed`);
      } catch (error) {
        console.error('Failed to update job status to completed:', error);
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Essay generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // Update job status to failed
    if (jobId) {
      try {
        await supabase
          .from('essay_analysis_jobs')
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
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

    const requestData: EssayRequest = await req.json();
    const { operation, jobId, userId, prompt, outline, content, title, essayType, wordCount, academicLevel, citationStyle, requirements, rubric, customRubric } = requestData;

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

    switch (type) {
      case 'outline':
        systemPrompt = `You are an expert academic writing assistant. Generate a detailed essay outline based on the given prompt and requirements.

Essay Type: ${essayType}
Target Word Count: ${wordCount}
Academic Level: ${academicLevel}
Citation Style: ${citationStyle}
${requirements && requirements.length > 0 ? `Requirements: ${requirements.join(', ')}` : ''}

Create a structured outline that includes:
1. A compelling title
2. Introduction with thesis statement
3. Main body points with supporting details
4. Conclusion
5. Suggested sources or evidence types

Format the outline clearly with Roman numerals, letters, and numbers for hierarchy.`;
        userPrompt = `Create an essay outline for: ${prompt}`;
        break;

      case 'content':
        systemPrompt = `You are an expert academic writing assistant. Expand the provided essay outline into a full, well-written essay.

Essay Type: ${essayType}
Target Word Count: ${wordCount}
Academic Level: ${academicLevel}
Citation Style: ${citationStyle}
${requirements && requirements.length > 0 ? `Requirements: ${requirements.join(', ')}` : ''}

Guidelines:
1. Write in a clear, academic tone appropriate for the specified level
2. Develop each point from the outline with detailed explanations and examples
3. Ensure smooth transitions between paragraphs
4. Include a strong introduction with a clear thesis statement
5. Provide substantial body paragraphs with evidence and analysis
6. Write a compelling conclusion that reinforces the main argument
7. Aim for approximately ${wordCount} words
8. Use proper ${citationStyle} citation format where applicable
9. Maintain consistency with the essay type (${essayType})

Original Prompt: ${prompt}

Outline to expand:
${outline}

Write the complete essay based on this outline.`;
        maxTokens = Math.min(4000, Math.max(1500, Math.floor(wordCount * 1.5)));
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

    switch (type) {
      case 'outline':
        // Extract title from the outline
        const lines = generatedText.split('\n');
        const titleLine = lines.find((line: string) => 
          line.toLowerCase().includes('title:') || 
          line.toLowerCase().includes('essay title:') ||
          (lines.indexOf(line) === 0 && line.trim().length > 0)
        );
        
        let extractedTitle = 'Generated Essay';
        if (titleLine) {
          extractedTitle = titleLine.replace(/^(title:|essay title:)/i, '').trim();
          extractedTitle = extractedTitle.replace(/^["']|["']$/g, '');
        }

        response.outline = generatedText;
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
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
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
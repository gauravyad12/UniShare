import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface AnalysisRequest {
  base64Image: string;
  mimeType: string;
  userCourses: any[];
  userId: string;
  filename: string;
  fileSize: number;
  jobId?: string;
}

interface AnalyzedCourse {
  code: string;
  name: string;
  credits: number;
  semester: string;
  status: 'completed' | 'missing' | 'suggested';
  confidence: number;
  prerequisites?: string[];
}

interface SuggestedPath {
  name: string;
  description: string;
  courses: string[];
  duration: string;
  totalCredits?: number;
}

interface AnalysisResult {
  courses: AnalyzedCourse[];
  suggestedPaths: SuggestedPath[];
  insights: {
    totalCoursesFound: number;
    completedCourses: number;
    remainingCourses: number;
    estimatedGraduationDate: string;
    recommendations: string[];
  };
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
    // Verify request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
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

    // Parse request body
    const requestData: AnalysisRequest = await req.json();
    const { base64Image, mimeType, userCourses, userId, filename, fileSize, jobId } = requestData;

    // Determine image detail level - always use high for better accuracy
    const imageDetail = 'high'; // Always use high detail for best results
    console.log(`Image size: ${fileSize} bytes, using detail level: ${imageDetail} (always high for accuracy)`);

    // Update job status to processing if jobId is provided
    if (jobId) {
      try {
        await supabase
          .from('flowchart_analysis_jobs')
          .update({ 
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      } catch (error) {
        console.error('Failed to update job status to processing:', error);
      }
    }

    // Validate required fields
    if (!base64Image || !mimeType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: base64Image, mimeType' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare user courses context
    const userCoursesContext = userCourses.length > 0 
      ? `User has completed these courses: ${userCourses.map(c => `${c.code} (${c.name})`).join(', ')}`
      : 'User has not completed any courses yet.';

    // Create OpenAI client with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      // Call OpenAI Vision API
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this degree flowchart image and extract ALL course information visible in the image. ${userCoursesContext}

IMPORTANT: Please read the ENTIRE flowchart carefully and extract ALL courses you can see, not just a subset. Look at every section, box, and text element in the image.

Please return a JSON response with this exact structure:
{
  "courses": [
    {
      "code": "CS101",
      "name": "Introduction to Computer Science",
      "credits": 3,
      "semester": "Fall 2024",
      "status": "completed|missing|suggested",
      "confidence": 0.95,
      "prerequisites": ["MATH101"]
    }
  ],
  "suggestedPaths": [
    {
      "name": "Standard Track",
      "description": "Traditional computer science pathway",
      "courses": ["CS101", "CS102", "CS201"],
      "duration": "4 years",
      "totalCredits": 120
    }
  ],
  "insights": {
    "totalCoursesFound": 15,
    "completedCourses": 5,
    "remainingCourses": 10,
    "estimatedGraduationDate": "Spring 2026",
    "recommendations": ["Focus on core CS courses first", "Consider taking math prerequisites"]
  }
}

Rules:
- Extract ALL courses visible in the flowchart, not just a sample
- Set status to "completed" for courses the user has already taken
- Set status to "missing" for required courses not yet taken
- Set status to "suggested" for elective or optional courses
- Confidence should be 0.0-1.0 based on how clearly the course is visible/readable
- Include realistic semester names and credit hours (typically 3-4 credits per course)
- Provide 2-3 suggested graduation pathways based on the flowchart structure
- Give practical recommendations based on the degree requirements shown
- Pay special attention to course codes, names, and any prerequisite arrows or connections
- If text is unclear, still include the course with lower confidence rather than omitting it
- Look for courses in all areas of the image including headers, footers, and side panels`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                    detail: imageDetail
                  }
                }
              ]
            }
          ],
          max_tokens: 4000,
          temperature: 0.1
        })
      });

      clearTimeout(timeoutId);

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}));
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const openaiResult = await openaiResponse.json();
      const content = openaiResult.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Parse the JSON response from OpenAI
      let analysisResult: AnalysisResult;
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        analysisResult = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Failed to parse analysis result');
      }

      // Validate and ensure proper data structure
      if (!analysisResult.courses) {
        analysisResult.courses = [];
      }
      if (!analysisResult.suggestedPaths) {
        analysisResult.suggestedPaths = [];
      }
      if (!analysisResult.insights) {
        analysisResult.insights = {
          totalCoursesFound: analysisResult.courses.length,
          completedCourses: analysisResult.courses.filter(c => c.status === 'completed').length,
          remainingCourses: analysisResult.courses.filter(c => c.status !== 'completed').length,
          estimatedGraduationDate: 'Unable to determine',
          recommendations: ['Please try uploading a clearer image']
        };
      }

      // Ensure all courses have confidence scores
      analysisResult.courses = analysisResult.courses.map(course => ({
        ...course,
        confidence: typeof course.confidence === 'number' ? course.confidence : 0.8 // Default confidence
      }));

      // Save analysis to database
      try {
        const { error: insertError } = await supabase
          .from('flowchart_analyses')
          .insert({
            user_id: userId,
            original_filename: filename,
            file_size: fileSize,
            analysis_result: analysisResult,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Failed to save analysis:', insertError);
          // Don't fail the request if we can't save to DB
        } else {
          console.log('Analysis saved successfully to database');
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Don't fail the request if we can't save to DB
      }

      // Update job status to completed if jobId is provided
      if (jobId) {
        try {
          await supabase
            .from('flowchart_analysis_jobs')
            .update({ 
              status: 'completed',
              analysis_result: analysisResult,
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId);
        } catch (error) {
          console.error('Failed to update job status to completed:', error);
        }
      }

      // Return the response in the format expected by the frontend
      return new Response(
        JSON.stringify({
          success: true,
          analysis: analysisResult
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );

    } catch (openaiError) {
      clearTimeout(timeoutId);
      console.error('OpenAI processing error:', openaiError);
      
      if (openaiError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Analysis timeout - please try with a smaller or clearer image' }),
          { status: 408, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      throw openaiError;
    }

  } catch (error) {
    console.error('Edge function error:', error);
    
    // Update job status to failed if jobId is provided
    if (jobId) {
      try {
        await supabase
          .from('flowchart_analysis_jobs')
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Internal server error',
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      } catch (updateError) {
        console.error('Failed to update job status to failed:', updateError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
}); 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('flowchart') as File;
    const userCoursesStr = formData.get('userCourses') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload JPG or PNG images only.' }, { status: 400 });
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 20MB.' }, { status: 400 });
    }

    const userCourses = JSON.parse(userCoursesStr || '[]');

    // Convert file to base64 for AI processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    
    // Get file extension for proper MIME type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg';
    if (fileExtension === 'png') mimeType = 'image/png';

    // Analyze flowchart with OpenAI GPT-4 Vision
    const analysisResult = await analyzeFlowchartWithAI(base64Image, mimeType, userCourses);

    // Store analysis result in database
    const { data: analysis, error: dbError } = await supabase
      .from('flowchart_analyses')
      .insert({
        user_id: user.id,
        original_filename: file.name,
        file_size: file.size,
        analysis_result: analysisResult,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      analysisId: analysis.id
    });

  } catch (error) {
    console.error('Flowchart analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function analyzeFlowchartWithAI(base64Image: string, mimeType: string, userCourses: any[]) {
  try {
    const userCoursesList = userCourses.map(c => `${c.code} - ${c.name} (${c.status})`).join('\n');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this university degree flowchart image carefully. I need you to extract and analyze course information.

USER'S CURRENT COURSES:
${userCoursesList || 'No courses provided'}

Please analyze the flowchart and provide a JSON response with this exact structure:

{
  "courses": [
    {
      "code": "COURSE_CODE",
      "name": "Course Name",
      "credits": 3,
      "semester": "Fall 2024",
      "status": "completed|missing|suggested",
      "confidence": 0.95,
      "prerequisites": ["PREREQ1", "PREREQ2"]
    }
  ],
  "suggestedPaths": [
    {
      "name": "Path Name",
      "description": "Description of this graduation path",
      "courses": ["COURSE1", "COURSE2"],
      "duration": "4 years",
      "totalCredits": 120
    }
  ],
  "insights": {
    "totalCoursesFound": 25,
    "completedCourses": 8,
    "remainingCourses": 17,
    "estimatedGraduationDate": "Spring 2026",
    "recommendations": ["Take math prerequisites first", "Consider summer courses"]
  }
}

IMPORTANT INSTRUCTIONS:
1. Extract ALL course codes and names visible in the flowchart
2. Determine course status: "completed" if user has taken it, "missing" if required but not taken, "suggested" for electives
3. Identify prerequisite relationships from flowchart arrows/connections
4. Suggest 2-3 optimal graduation paths based on remaining courses
5. Provide realistic semester placements and graduation timeline
6. Include confidence scores (0-1) for course extraction accuracy
7. Give actionable recommendations for course planning

Return ONLY the JSON response, no additional text.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let parsedResult;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      parsedResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid response format from AI');
    }

    // Validate and structure the response
    return {
      courses: parsedResult.courses || [],
      suggestedPaths: parsedResult.suggestedPaths || [],
      insights: parsedResult.insights || {
        totalCoursesFound: parsedResult.courses?.length || 0,
        completedCourses: parsedResult.courses?.filter((c: any) => c.status === 'completed').length || 0,
        remainingCourses: parsedResult.courses?.filter((c: any) => c.status !== 'completed').length || 0,
        estimatedGraduationDate: 'Unknown',
        recommendations: []
      }
    };

  } catch (error) {
    console.error('OpenAI analysis error:', error);
    
    // Fallback response if AI fails
    return {
      courses: [],
      suggestedPaths: [],
      insights: {
        totalCoursesFound: 0,
        completedCourses: 0,
        remainingCourses: 0,
        estimatedGraduationDate: 'Unable to determine',
        recommendations: ['Please try uploading a clearer image of your flowchart']
      },
      error: 'Failed to analyze flowchart. Please ensure the image is clear and contains a valid degree flowchart.'
    };
  }
} 
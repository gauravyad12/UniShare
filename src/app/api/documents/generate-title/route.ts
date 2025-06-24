import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentNames } = await request.json();

    if (!documentNames || !Array.isArray(documentNames) || documentNames.length === 0) {
      return NextResponse.json({ error: "Document names are required" }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      // Fallback to basic title generation
      return NextResponse.json({ 
        title: `Chat with ${documentNames.slice(0, 2).join(', ')}${documentNames.length > 2 ? ' and others' : ''}` 
      });
    }

    try {
      const documentsText = documentNames.join(', ');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that creates concise, descriptive titles for document chat sessions. Generate a title that captures the main topic or purpose of the documents. Keep it under 50 characters and make it engaging. Focus on the subject matter, not just the document names.'
            },
            {
              role: 'user',
              content: `Create a chat session title for these documents: ${documentsText}`
            }
          ],
          max_tokens: 30,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API error');
      }

      const result = await response.json();
      let generatedTitle = result.choices?.[0]?.message?.content?.trim();
      
      if (generatedTitle && generatedTitle.length > 0) {
        // Remove surrounding quotes if present
        if ((generatedTitle.startsWith('"') && generatedTitle.endsWith('"')) ||
            (generatedTitle.startsWith("'") && generatedTitle.endsWith("'"))) {
          generatedTitle = generatedTitle.slice(1, -1).trim();
        }
        
        return NextResponse.json({ title: generatedTitle });
      } else {
        throw new Error('No title generated');
      }
    } catch (aiError) {
      // Fallback to basic title generation if AI fails
      return NextResponse.json({ 
        title: `Chat with ${documentNames.slice(0, 2).join(', ')}${documentNames.length > 2 ? ' and others' : ''}` 
      });
    }

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate title" },
      { status: 500 }
    );
  }
} 
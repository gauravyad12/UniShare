import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { message, documentIds, sessionId, messageHistory } = await request.json();

    if (!message || !documentIds || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get documents content
    const { data: documents, error: documentsError } = await supabase
      .from('document_chat_documents')
      .select('id, name, content, text_chunks')
      .in('id', documentIds)
      .eq('user_id', user.id)
      .eq('status', 'ready');

    if (documentsError || !documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'No valid documents found' },
        { status: 400 }
      );
    }

    // Find relevant content chunks
    const relevantSources = await findRelevantContent(message, documents);

    // Generate AI response
    const aiResponse = await generateAIResponse(message, relevantSources, messageHistory);

    return NextResponse.json({
      success: true,
      response: aiResponse.content,
      sources: aiResponse.sources
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function findRelevantContent(query: string, documents: any[]): Promise<any[]> {
  // Simple keyword-based search for now
  // In production, you'd want to use vector embeddings for better semantic search
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const relevantSources = [];

  for (const doc of documents) {
    // Handle both new text_chunks format and legacy content format
    if (doc.text_chunks && Array.isArray(doc.text_chunks)) {
      // New format: structured chunks
      for (const chunk of doc.text_chunks) {
        let relevanceScore = 0;
        const chunkText = chunk.content.toLowerCase();
        
        // Calculate relevance based on keyword matches
        for (const word of queryWords) {
          const matches = (chunkText.match(new RegExp(word, 'g')) || []).length;
          relevanceScore += matches;
        }
        
        if (relevanceScore > 0) {
          relevantSources.push({
            documentId: doc.id,
            documentName: doc.name,
            content: chunk.content,
            section: chunk.section,
            page: chunk.page,
            relevance: relevanceScore
          });
        }
      }
    } else if (doc.content) {
      // Legacy format: split content into chunks
      const chunkSize = 1000;
      const words = doc.content.split(/\s+/);
      let currentChunk = '';
      let chunkIndex = 0;
      
      for (const word of words) {
        if (currentChunk.length + word.length + 1 <= chunkSize) {
          currentChunk += (currentChunk ? ' ' : '') + word;
        } else {
          if (currentChunk) {
            // Process this chunk
            let relevanceScore = 0;
            const chunkText = currentChunk.toLowerCase();
            
            for (const queryWord of queryWords) {
              const matches = (chunkText.match(new RegExp(queryWord, 'g')) || []).length;
              relevanceScore += matches;
            }
            
            if (relevanceScore > 0) {
              relevantSources.push({
                documentId: doc.id,
                documentName: doc.name,
                content: currentChunk,
                section: `Chunk ${chunkIndex + 1}`,
                page: Math.floor(chunkIndex * chunkSize / 3000) + 1,
                relevance: relevanceScore
              });
            }
            
            chunkIndex++;
          }
          currentChunk = word;
        }
      }
      
      // Process final chunk
      if (currentChunk) {
        let relevanceScore = 0;
        const chunkText = currentChunk.toLowerCase();
        
        for (const queryWord of queryWords) {
          const matches = (chunkText.match(new RegExp(queryWord, 'g')) || []).length;
          relevanceScore += matches;
        }
        
        if (relevanceScore > 0) {
          relevantSources.push({
            documentId: doc.id,
            documentName: doc.name,
            content: currentChunk,
            section: `Chunk ${chunkIndex + 1}`,
            page: Math.floor(chunkIndex * chunkSize / 3000) + 1,
            relevance: relevanceScore
          });
        }
      }
    }
  }

  // Sort by relevance and return top 5
  return relevantSources
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);
}

async function generateAIResponse(query: string, sources: any[], messageHistory: any[]): Promise<{ content: string; sources: any[] }> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare context from sources
    const contextText = sources.map((source, index) => 
      `[Source ${index + 1} - ${source.documentName}${source.page ? `, Page ${source.page}` : ''}${source.section ? `, ${source.section}` : ''}]:\n${source.content}`
    ).join('\n\n');

    // Prepare conversation history
    const conversationHistory = messageHistory.slice(-5).map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    const systemPrompt = `You are an AI assistant that helps users understand and analyze their documents. You have access to relevant excerpts from the user's documents to answer their questions.

Guidelines:
- Answer questions based on the provided document content
- If the answer isn't in the provided sources, say so clearly
- Cite specific sources when referencing information
- Be helpful, accurate, and concise
- If asked about something not in the documents, explain that you can only help with the uploaded document content

Available document content:
${contextText}`;

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
          ...conversationHistory,
          { role: 'user', content: query }
        ],
        max_tokens: 1500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const aiContent = result.choices?.[0]?.message?.content || 'I apologize, but I was unable to generate a response.';

    // Format sources for frontend
    const formattedSources = sources.map(source => ({
      page: source.page,
      section: source.section,
      content: source.content.slice(0, 200) + (source.content.length > 200 ? '...' : ''),
      relevance: source.relevance
    }));

    return {
      content: aiContent,
      sources: formattedSources
    };

  } catch (error) {
    console.error('AI response generation error:', error);
    throw new Error('Failed to generate AI response');
  }
} 
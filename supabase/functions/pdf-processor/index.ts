import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface PDFProcessingRequest {
  documentId: string;
  userId: string;
  filename: string;
  jobId: string;
  base64Content: string;
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

    const requestData: PDFProcessingRequest = await req.json();
    const { documentId, userId, filename, jobId, base64Content } = requestData;

    console.log('PDF Processor called:', { documentId, userId, filename, jobId });

    // Update job status to processing
    await supabase
      .from('document_processing_jobs')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Method 1: Try to use OpenAI with a clever prompt to extract PDF content
    // This is a workaround since we can't directly process PDFs
    console.log('Attempting PDF text extraction via OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a PDF processing assistant. The user has a PDF document that needs text extraction for a document chat system. Since direct PDF processing through Vision API is not supported, provide guidance on the best approaches for PDF text extraction.'
          },
          {
            role: 'user',
            content: `I need to extract text from a PDF file named "${filename}" for a document chat system. The PDF is ${Math.round(base64Content.length * 0.75 / 1024)}KB in size.

Since OpenAI Vision API doesn't support PDFs directly, what are the recommended approaches? Please provide:

1. A brief explanation of why PDFs need special handling
2. The most effective methods for PDF text extraction
3. Specific recommendations for implementing ChatPDF-like functionality

Please keep the response concise and technical.`
          }
        ],
        max_tokens: 500,
        temperature: 0.1,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const guidance = result.choices?.[0]?.message?.content || 'PDF processing guidance not available';

    // For now, we'll create a helpful error message with the guidance
    const errorMessage = `PDF Processing Implementation Needed

${guidance}

Current Status: This PDF cannot be processed yet because we need to implement proper PDF-to-text extraction. 

Recommended Solutions:
1. **Convert to Images**: Export your PDF pages as PNG/JPEG images and upload those
2. **Extract Text**: Use a PDF reader to copy/paste text into a .txt file
3. **Online Converters**: Use PDF-to-text online tools, then upload the text file

Technical Implementation Needed:
- PDF-to-images conversion (using pdf2pic or similar)
- OCR processing for each page
- Text chunking and indexing

Filename: ${filename}`;

    // Update document status to error with helpful message
    await supabase
      .from('document_chat_documents')
      .update({
        status: 'error',
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    // Update job status to failed with guidance
    await supabase
      .from('document_processing_jobs')
      .update({ 
        status: 'failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        guidance: guidance
      }),
      { 
        status: 422, // Unprocessable Entity
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('PDF processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'PDF processing failed' 
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
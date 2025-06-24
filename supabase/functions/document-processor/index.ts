import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { resolvePDFJS } from "https://esm.sh/pdfjs-serverless@0.4.2";

interface DocumentProcessingRequest {
  documentId: string;
  userId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  jobId?: string;
  base64Content?: string;
}

interface DocumentProcessingResponse {
  success: boolean;
  content?: string;
  textChunks?: string[];
  pageCount?: number;
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

    const requestData: DocumentProcessingRequest = await req.json();
    const { documentId, userId, filename, fileType, fileSize, jobId, base64Content } = requestData;

    console.log('Document Processor Edge Function called:', {
      documentId,
      userId,
      filename,
      fileType,
      fileSize: fileSize ? `${Math.round(fileSize / 1024)}KB` : 'unknown',
      jobId,
      hasContent: !!base64Content
    });

    // Validate required fields
    if (!documentId || !userId || !filename || !fileType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: documentId, userId, filename, fileType' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update job status to processing if jobId is provided
    if (jobId) {
      try {
        await supabase
          .from('document_processing_jobs')
          .update({ 
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
        console.log(`Updated job ${jobId} status to processing`);
      } catch (error) {
        console.error('Failed to update job status to processing:', error);
      }
    }

    let extractedContent = '';
    let textChunks: string[] = [];
    let pageCount = 1;

    // Process based on file type
    if (fileType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
      // ============ PDF PROCESSING IMPLEMENTATION ============
      // This implements a proper ChatPDF-like solution
      
      if (!base64Content) {
        throw new Error('Base64 content required for PDF processing');
      }

      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      console.log('Processing PDF with advanced text extraction...');

      try {
        console.log('Processing PDF with advanced PDF.js library...');
        
        // Convert base64 to Uint8Array for PDF.js
        const pdfData = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
        console.log(`PDF data loaded: ${pdfData.length} bytes`);
        
        // Use PDF.js to properly parse the PDF
        const { getDocument } = await resolvePDFJS();
        const doc = await getDocument({ data: pdfData, useSystemFonts: true }).promise;
        
        pageCount = doc.numPages;
        console.log(`PDF loaded successfully: ${pageCount} pages`);
        
        const allText: string[] = [];
        
        // Extract text from each page
        for (let i = 1; i <= pageCount; i++) {
          console.log(`Processing page ${i}/${pageCount}...`);
          const page = await doc.getPage(i);
          const textContent = await page.getTextContent();
          
          // Extract text items and join them
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .trim();
          
          if (pageText) {
            allText.push(pageText);
          }
        }
        
        // Combine all pages
        extractedContent = allText.join('\n\n').trim();
        
        console.log(`PDF text extraction completed: ${extractedContent.length} characters from ${pageCount} pages`);
        
        // If no meaningful text was extracted, provide guidance
        if (extractedContent.length < 50) {
          console.log('Limited text found in PDF, providing user guidance...');
          
          extractedContent = `# PDF Document: "${filename}"

**File Size:** ${Math.round(fileSize / 1024)}KB  
**Pages:** ${pageCount}

## ⚠️ Limited Text Content Detected

This PDF was successfully parsed but contains very little extractable text. This commonly occurs with:

### **Possible Reasons:**
- **Scanned Document:** The PDF contains images of text rather than actual text
- **Image-based PDF:** Created from photos or scans
- **Complex Layout:** Advanced formatting that requires manual extraction
- **Protected Content:** Text may be embedded in a non-standard way

### **Recommended Solutions:**

**Option 1: Convert to Images** ⭐ *Recommended*
1. Export each PDF page as PNG/JPEG images
2. Upload the images here - our AI can read text from images using OCR

**Option 2: Manual Text Extraction**
1. Open the PDF in Adobe Reader, Preview, or similar
2. Try selecting and copying text (Ctrl/Cmd + A, then Ctrl/Cmd + C)
3. Paste into a .txt file and upload that instead

**Option 3: Online PDF Tools**
- Use SmallPDF, PDF24, or ILovePDF to convert to text
- Try Adobe Acrobat's "Export as Text" feature

### **What Our System Found:**
- Successfully parsed ${pageCount} page${pageCount !== 1 ? 's' : ''}
- Extracted ${extractedContent.length} characters of text
- File structure appears valid

---

*We're continuously improving our PDF processing capabilities. Try the solutions above for the best chat experience with your document!*`;
        }

      } catch (pdfError) {
        console.error('PDF processing error:', pdfError);
        
        // Provide a helpful error with guidance
        const errorMessage = `# PDF Processing Error

**File:** ${filename}  
**Size:** ${Math.round(fileSize / 1024)}KB

## 🚨 Unable to Process PDF

The PDF parsing library encountered an error while trying to extract text from this document.

### **Common Causes:**
- **Corrupted PDF:** The file may be damaged or incomplete
- **Password Protected:** The PDF requires a password to access content
- **Unsupported Format:** Very old or non-standard PDF format
- **Complex Structure:** Advanced PDF features not supported

### **Immediate Solutions:**

**Option 1: Try Manual Text Extraction** ⭐
1. Open the PDF in a PDF reader (Adobe, Preview, etc.)
2. Select all text (Ctrl/Cmd + A) and copy (Ctrl/Cmd + C)
3. Create a .txt file, paste the content, and upload that

**Option 2: Convert to Images**
1. Export PDF pages as PNG/JPEG images
2. Upload the images - our AI can read text from images

**Option 3: Use Online Tools**
- SmallPDF, PDF24, or ILovePDF for text conversion
- Adobe Acrobat's "Export as Text" feature

### **Technical Details:**
\`\`\`
Error: ${pdfError instanceof Error ? pdfError.message : 'Unknown PDF parsing error'}
\`\`\`

---

*If this PDF worked in other tools, please try the manual extraction methods above. We're continuously improving our PDF processing capabilities.*`;

        throw new Error(errorMessage);
      }

    } else if (fileType.startsWith('image/')) {
      // For images, use OpenAI Vision API
      if (!base64Content) {
        throw new Error('Base64 content required for image processing');
      }

      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
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
                    text: 'Extract all text content from this image. Return only the plain text content without any formatting or analysis. If there are multiple sections or columns, maintain their logical order.'
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${fileType};base64,${base64Content}`,
                      detail: 'high'
                    }
                  }
                ]
              }
            ],
            max_tokens: 2000,
            temperature: 0.1,
          }),
        });

        clearTimeout(timeoutId);

        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.json().catch(() => ({}));
          console.error('OpenAI API error:', errorData);
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }

        const openaiResult = await openaiResponse.json();
        extractedContent = openaiResult.choices[0]?.message?.content || '';
        
        if (!extractedContent.trim()) {
          throw new Error('No text content could be extracted from the image');
        }

      } catch (openaiError: any) {
        clearTimeout(timeoutId);
        console.error('OpenAI processing error:', openaiError);
        
        if (openaiError.name === 'AbortError') {
          throw new Error('Image processing timeout - please try with a smaller file');
        }
        
        throw openaiError;
      }

    } else if (fileType.startsWith('text/') || fileType.includes('document') || fileType.includes('word')) {
      // For text files and documents, decode base64 content directly
      if (!base64Content) {
        throw new Error('Base64 content required for text processing');
      }

      try {
        // Decode base64 content
        const decoder = new TextDecoder('utf-8');
        const uint8Array = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
        extractedContent = decoder.decode(uint8Array);
        
        if (!extractedContent.trim()) {
          throw new Error('No text content found in the document');
        }
      } catch (error) {
        console.error('Text decoding error:', error);
        throw new Error('Failed to decode text content from the document');
      }

    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Create text chunks for better AI processing (split into ~1000 character chunks)
    const chunkSize = 1000;
    const words = extractedContent.split(/\s+/);
    let currentChunk = '';
    
    for (const word of words) {
      if (currentChunk.length + word.length + 1 <= chunkSize) {
        currentChunk += (currentChunk ? ' ' : '') + word;
      } else {
        if (currentChunk) {
          textChunks.push(currentChunk);
        }
        currentChunk = word;
      }
    }
    
    if (currentChunk) {
      textChunks.push(currentChunk);
    }

    // Estimate page count based on content length (rough approximation)
    if (pageCount === 1 && extractedContent.length > 2000) {
      pageCount = Math.max(1, Math.ceil(extractedContent.length / 3000));
    }

    console.log('Processing completed:', {
      contentLength: extractedContent.length,
      pageCount,
      chunksCount: textChunks.length
    });

    // Prepare text chunks for database storage
    const chunksForDB = textChunks.map((chunk, index) => ({ 
      content: chunk, 
      section: `Chunk ${index + 1}`, 
      page: Math.min(Math.floor(index / 3) + 1, pageCount)
    }));

    console.log('Updating document in database:', {
      documentId,
      contentLength: extractedContent.length,
      chunksCount: chunksForDB.length,
      pageCount
    });

    // Additional sanitization for database storage
    const sanitizeForDB = (text: string): string => {
      return text
        .replace(/\0/g, '')                           // Remove null bytes
        .replace(/[\uFFFE\uFFFF]/g, '')              // Remove Unicode non-characters
        .replace(/[\uD800-\uDFFF]/g, '')             // Remove unpaired surrogates
        .replace(/[^\u0020-\u007E\u00A0-\uD7FF\uE000-\uFFFD]/g, ' ') // Keep safe Unicode ranges
        .trim();
    };

    // Sanitize content and chunks
    const sanitizedContent = sanitizeForDB(extractedContent);
    const sanitizedChunks = chunksForDB.map(chunk => ({
      ...chunk,
      content: sanitizeForDB(chunk.content)
    }));

    console.log('Updating document in database:', {
      documentId,
      originalContentLength: extractedContent.length,
      sanitizedContentLength: sanitizedContent.length,
      chunksCount: sanitizedChunks.length,
      pageCount
    });

    // Update document with extracted content
    const { error: updateError } = await supabase
      .from('document_chat_documents')
      .update({
        status: 'ready',
        content: sanitizedContent,
        page_count: pageCount,
        text_chunks: sanitizedChunks,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Database update error:', updateError);
      console.error('Update data:', {
        documentId,
        contentLength: sanitizedContent.length,
        chunksCount: sanitizedChunks.length,
        sampleChunk: sanitizedChunks[0]?.content?.substring(0, 100) + '...'
      });
      throw new Error(`Failed to save processed content: ${updateError.message || updateError.code || 'Unknown error'}`);
    }

    // Update job status to completed if jobId is provided
    if (jobId) {
      try {
        await supabase
          .from('document_processing_jobs')
          .update({ 
            status: 'completed',
            result: {
              contentLength: extractedContent.length,
              pageCount,
              chunksCount: textChunks.length
            },
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
        console.log(`Updated job ${jobId} status to completed`);
      } catch (error) {
        console.error('Failed to update job status to completed:', error);
      }
    }

    const response: DocumentProcessingResponse = {
      success: true,
      content: extractedContent,
      textChunks,
      pageCount
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (processingError: any) {
    console.error('Document processing error:', processingError);
    
    const errorMessage = processingError instanceof Error ? processingError.message : 'Processing failed';
    
    // Get request data for cleanup (if available)
    let documentId: string | undefined;
    let jobId: string | undefined;
    
    try {
      const requestData = await req.clone().json();
      documentId = requestData.documentId;
      jobId = requestData.jobId;
    } catch {
      // Ignore if we can't parse request data
    }
    
    // Initialize Supabase client for error handling
    const authHeader = req.headers.get('Authorization');
    if (authHeader && documentId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: authHeader } }
        });

        // Update document status to error
        await supabase
          .from('document_chat_documents')
          .update({
            status: 'error',
            error_message: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);

        // Update job status to failed if jobId is provided
        if (jobId) {
          await supabase
            .from('document_processing_jobs')
            .update({ 
              status: 'failed',
              error_message: errorMessage,
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId);
          console.log(`Updated job ${jobId} status to failed`);
        }
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
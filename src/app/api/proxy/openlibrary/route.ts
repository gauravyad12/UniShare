import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route since it uses request.nextUrl.searchParams
export const dynamic = "force-dynamic";

/**
 * Proxy endpoint specifically for Open Library covers
 * This helps bypass CORS and CSP issues by fetching the image on the server side
 * and serving it directly from our domain
 */
export async function GET(request: NextRequest) {
  try {
    // Get the ISBN from the query parameter
    const isbn = request.nextUrl.searchParams.get('isbn');
    const size = request.nextUrl.searchParams.get('size') || 'L'; // Default to large size
    
    if (!isbn) {
      return new NextResponse('Missing ISBN parameter', { status: 400 });
    }
    
    // Construct the Open Library URL
    const openLibraryUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
    
    // Fetch the image
    const response = await fetch(openLibraryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    
    if (!response.ok) {
      console.error(`Error fetching Open Library cover: ${response.status} ${response.statusText}`);
      return new NextResponse(`Failed to fetch image: ${response.status}`, { status: response.status });
    }
    
    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    
    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Return the image with the appropriate content type and headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Content-Disposition': `inline; filename="isbn-${isbn}.jpg"`, // Set filename for download
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error in Open Library proxy endpoint:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

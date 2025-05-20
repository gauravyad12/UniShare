import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route since it uses request.nextUrl.searchParams
export const dynamic = "force-dynamic";

/**
 * Proxy endpoint for images
 * This helps bypass CORS and CSP issues by fetching the image on the server side
 * and serving it directly from our domain
 */
export async function GET(request: NextRequest) {
  try {
    // Get the URL from the query parameter
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(url);

    // Fetch the image
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error(`Error fetching image: ${response.status} ${response.statusText}`);
      return new NextResponse(`Failed to fetch image: ${response.status}`, { status: response.status });
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'image/png';

    // Get filename from URL or use a default
    let filename = 'Solution Image';

    // Check if a title was provided in the request
    const title = request.nextUrl.searchParams.get('title');
    if (title) {
      filename = title;
    } else {
      try {
        // Try to extract filename from URL
        const urlObj = new URL(decodedUrl);
        const filenameParam = urlObj.searchParams.get('filename');
        if (filenameParam) {
          filename = decodeURIComponent(filenameParam);
        }
      } catch (e) {
        // If URL parsing fails, use default filename
      }
    }

    // Return the image with the appropriate content type and headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Content-Disposition': `inline; filename="${filename}"`, // Set filename for download and title
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error in proxy endpoint:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

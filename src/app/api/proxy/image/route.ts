import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Force dynamic rendering for this route since it uses request.nextUrl.searchParams
export const dynamic = "force-dynamic";

/**
 * Proxy endpoint for images
 * This helps bypass CORS and CSP issues by fetching the image on the server side
 * and serving it directly from our domain
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication and subscription check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse('Authentication required', { status: 401 });
    }

    // Check if user has an active Scholar+ subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!subscription) {
      return new NextResponse('Scholar+ subscription required', { status: 403 });
    }

    // Check if subscription is still valid
    const currentTime = Math.floor(Date.now() / 1000);
    const isValid = subscription.status === "active" &&
                    (!subscription.current_period_end ||
                     subscription.current_period_end > currentTime);

    if (!isValid) {
      return new NextResponse('Active Scholar+ subscription required', { status: 403 });
    }

    // Get the URL from the query parameter
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(url);

    // Security validation - block access to our own domain
    try {
      const targetUrl = new URL(decodedUrl);
      const hostname = targetUrl.hostname.toLowerCase();
      if (hostname.includes('unishare.app') || hostname.includes('localhost:3000') || hostname.includes('127.0.0.1:3000')) {
        return new NextResponse('Access to UniShare domains is not allowed through the proxy', { status: 403 });
      }
    } catch {
      return new NextResponse('Invalid URL format', { status: 400 });
    }

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

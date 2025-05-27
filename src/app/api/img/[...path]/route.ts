import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

// Rate limiting for IMG routes
const imgRateLimit = new Map<string, { count: number; resetTime: number }>();
const IMG_RATE_LIMIT = 30; // Max 30 image requests per minute per IP
const IMG_WINDOW = 60 * 1000; // 1 minute

function checkImgRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = imgRateLimit.get(ip);

  if (!entry || now > entry.resetTime) {
    imgRateLimit.set(ip, { count: 1, resetTime: now + IMG_WINDOW });
    return true;
  }

  if (entry.count >= IMG_RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Catch-all route for /api/img/* requests
 * These are malformed proxy URLs that should go through the web proxy
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Rate limit image requests
    if (!checkImgRateLimit(clientIP)) {
      console.log(`IMG rate limit exceeded for IP: ${clientIP}`);
      return new NextResponse('Rate limit exceeded for image requests.', {
        status: 429,
        headers: {
          'Retry-After': '60',
        }
      });
    }

    const pathSegments = params.path;

    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Invalid image path', { status: 400 });
    }

    // Determine base URL from common patterns
    let baseUrl = 'https://www.example.com';
    const resourcePath = '/' + pathSegments.join('/');

    // Check for common gaming sites
    if (resourcePath.includes('battlepass') || resourcePath.includes('medal')) {
      baseUrl = 'https://krunker.io';
    } else if (resourcePath.includes('khan')) {
      baseUrl = 'https://www.khanacademy.org';
    }

    const fullUrl = baseUrl + '/img' + resourcePath;

    console.log('IMG catch-all redirecting:', resourcePath, 'to:', fullUrl);

    // Redirect to the proper web proxy endpoint
    const proxyUrl = `/api/proxy/web?url=${encodeURIComponent(fullUrl)}`;

    // Forward the request to the web proxy
    const response = await fetch(new URL(proxyUrl, request.url), {
      method: request.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Referer': request.headers.get('referer') || baseUrl,
      },
    });

    if (!response.ok) {
      // Return placeholder image for 404s
      const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#f8f9fa" stroke="#dee2e6"/>
        <path d="M30 35h40v30H30z" fill="#6c757d" opacity="0.3"/>
        <circle cx="40" cy="45" r="3" fill="#6c757d"/>
        <text x="50" y="80" text-anchor="middle" font-size="8" fill="#6c757d">IMG</text>
      </svg>`;

      return new NextResponse(placeholderSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Get the content and content type
    const content = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error in IMG catch-all proxy:', error);

    // Return placeholder on error
    const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#f8f9fa" stroke="#dee2e6"/>
      <text x="50" y="50" text-anchor="middle" font-size="12" fill="#6c757d">Error</text>
    </svg>`;

    return new NextResponse(placeholderSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }
}

// Handle other HTTP methods
export const POST = GET;
export const PUT = GET;
export const DELETE = GET;
export const OPTIONS = GET;

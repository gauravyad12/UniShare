import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

// Rate limiting configuration for catch-all routes
const CATCH_ALL_RATE_LIMITING_ENABLED = true; // Enabled to prevent abuse
const catchAllRateLimit = new Map<string, { count: number; resetTime: number }>();
const CATCH_ALL_RATE_LIMIT = 50; // Max 50 requests per minute per IP
const CATCH_ALL_WINDOW = 60 * 1000; // 1 minute

function checkCatchAllRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = catchAllRateLimit.get(ip);

  if (!entry || now > entry.resetTime) {
    catchAllRateLimit.set(ip, { count: 1, resetTime: now + CATCH_ALL_WINDOW });
    return true;
  }

  if (entry.count >= CATCH_ALL_RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Catch-all proxy route to handle malformed proxy URLs
 * This catches requests like /api/proxy/fonts/... and redirects them properly
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

    // Rate limit catch-all requests (if enabled)
    if (CATCH_ALL_RATE_LIMITING_ENABLED && !checkCatchAllRateLimit(clientIP)) {
      console.log(`Catch-all rate limit exceeded for IP: ${clientIP}`);
      return new NextResponse('Rate limit exceeded for proxy requests.', {
        status: 429,
        headers: {
          'Retry-After': '60',
        }
      });
    }

    // Get the path segments
    const pathSegments = params.path;

    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Invalid proxy path', { status: 400 });
    }

    // Get the referer to determine the base URL
    const referer = request.headers.get('referer');
    let baseUrl = 'https://venge.io'; // Default fallback

    // Smart detection based on path patterns
    const pathString = pathSegments.join('/');
    if (pathString.includes('asset/') || pathString.includes('zombs')) {
      baseUrl = 'https://zombsroyale.io';
    } else if (pathString.includes('venge') || pathString.includes('img/') || pathString.includes('gui/')) {
      baseUrl = 'https://venge.io';
    }

    if (referer) {
      try {
        // Extract the original URL from the referer
        const refererUrl = new URL(referer);

        // Check if referer is a proxy URL
        if (refererUrl.pathname.includes('/proxy-browser')) {
          // Look for the current URL in the referer's hash or search params
          const urlParam = refererUrl.searchParams.get('url');
          if (urlParam) {
            const originalUrl = new URL(decodeURIComponent(urlParam));
            baseUrl = `${originalUrl.protocol}//${originalUrl.host}`;
          }
        } else if (refererUrl.pathname.includes('/api/proxy/web')) {
          // Extract from proxy web URL
          const urlParam = refererUrl.searchParams.get('url');
          if (urlParam) {
            const originalUrl = new URL(decodeURIComponent(urlParam));
            baseUrl = `${originalUrl.protocol}//${originalUrl.host}`;
          }
        } else {
          // Try to get from the current page context
          // Check common gaming/educational sites based on the resource path
          if (pathSegments.some(segment => segment.includes('krunker') || segment.includes('battlepass'))) {
            baseUrl = 'https://krunker.io';
          } else if (pathSegments.some(segment => segment.includes('khan'))) {
            baseUrl = 'https://www.khanacademy.org';
          } else if (pathSegments.some(segment => segment.includes('coursera'))) {
            baseUrl = 'https://www.coursera.org';
          } else if (pathSegments.some(segment =>
            segment.includes('venge') ||
            segment.includes('img') ||
            segment.includes('gui') ||
            segment.includes('banners') ||
            segment.includes('loadout')
          )) {
            baseUrl = 'https://venge.io';
          } else if (pathSegments.some(segment =>
            segment.includes('asset') ||
            segment.includes('zombs') ||
            segment.includes('build') ||
            segment.includes('webgl')
          )) {
            baseUrl = 'https://zombsroyale.io';
          }
        }
      } catch (e) {
        console.log('Could not parse referer for base URL:', e);

        // Fallback: try to guess from the resource path
        if (pathSegments.some(segment => segment.includes('krunker') || segment.includes('battlepass'))) {
          baseUrl = 'https://krunker.io';
        } else if (pathSegments.some(segment => segment.includes('khan'))) {
          baseUrl = 'https://www.khanacademy.org';
        } else if (pathSegments.some(segment =>
          segment.includes('venge') ||
          segment.includes('img') ||
          segment.includes('gui') ||
          segment.includes('banners') ||
          segment.includes('loadout') ||
          segment.includes('ui')
        )) {
          baseUrl = 'https://venge.io';
        } else if (pathSegments.some(segment =>
          segment.includes('asset') ||
          segment.includes('zombs') ||
          segment.includes('build') ||
          segment.includes('webgl') ||
          segment.includes('help-')
        )) {
          baseUrl = 'https://zombsroyale.io';
        }
      }
    }

    // Reconstruct the full URL
    const resourcePath = '/' + pathSegments.join('/');
    const fullUrl = baseUrl + resourcePath;

    console.log('Catch-all proxy redirecting:', resourcePath, 'to:', fullUrl);

    // Try to fetch the resource directly first
    try {
      const directResponse = await fetch(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Referer': baseUrl,
          'Origin': baseUrl,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (directResponse.ok) {
        const content = await directResponse.arrayBuffer();
        let contentType = directResponse.headers.get('content-type') || 'application/octet-stream';

        // Ensure correct content type based on file extension
        if (resourcePath.endsWith('.js')) {
          contentType = 'application/javascript';
        } else if (resourcePath.endsWith('.css')) {
          contentType = 'text/css';
        } else if (resourcePath.endsWith('.json')) {
          contentType = 'application/json';
        }

        return new NextResponse(content, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch (directError) {
      console.log('Direct fetch failed, trying proxy route:', directError);
    }

    // If direct fetch fails, try through the web proxy
    const proxyUrl = `/api/proxy/web?url=${encodeURIComponent(fullUrl)}`;

    const response = await fetch(new URL(proxyUrl, request.url), {
      method: request.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': request.headers.get('referer') || baseUrl,
      },
    });

    if (!response.ok) {
      // Return appropriate empty content based on file type
      if (resourcePath.endsWith('.js')) {
        return new NextResponse('// File not found', {
          status: 200,
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'public, max-age=300',
          },
        });
      } else if (resourcePath.endsWith('.css')) {
        return new NextResponse('/* File not found */', {
          status: 200,
          headers: {
            'Content-Type': 'text/css',
            'Cache-Control': 'public, max-age=300',
          },
        });
      } else {
        return new NextResponse(`Failed to fetch resource: ${response.status}`, {
          status: response.status
        });
      }
    }

    // Get the content and ensure correct content type
    const content = await response.arrayBuffer();
    let contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Override content type based on file extension to ensure correct MIME type
    if (resourcePath.endsWith('.js')) {
      contentType = 'application/javascript';
    } else if (resourcePath.endsWith('.css')) {
      contentType = 'text/css';
    } else if (resourcePath.endsWith('.json')) {
      contentType = 'application/json';
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error in catch-all proxy:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handle other HTTP methods
export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return GET(request, { params });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return GET(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return GET(request, { params });
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

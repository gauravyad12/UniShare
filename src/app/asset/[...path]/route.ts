import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

/**
 * Catch-all route for /asset/ paths from Zombs Royale
 * This handles direct requests to asset paths and redirects them through the proxy
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the original path from the segments
    const originalPath = '/asset/' + params.path.join('/');
    
    console.log(`Asset catch-all intercepted: ${originalPath}`);
    
    // Default to zombsroyale.io for /asset/ paths
    const baseUrl = 'https://zombsroyale.io';
    const fullUrl = `${baseUrl}${originalPath}`;
    
    // Preserve query parameters
    const searchParams = request.nextUrl.searchParams;
    const fullUrlWithParams = searchParams.toString() ? 
      `${fullUrl}?${searchParams.toString()}` : fullUrl;
    
    console.log(`Redirecting ${originalPath} to ${fullUrlWithParams} via proxy`);
    
    // Create a new request to our main proxy endpoint
    const proxyUrl = new URL('/api/proxy/web', request.url);
    proxyUrl.searchParams.set('url', fullUrlWithParams);
    
    // Forward all headers from the original request
    const proxyHeaders = new Headers();
    request.headers.forEach((value, key) => {
      // Skip host header to avoid conflicts
      if (key.toLowerCase() !== 'host') {
        proxyHeaders.set(key, value);
      }
    });
    
    // Make the request to our proxy
    const proxyResponse = await fetch(proxyUrl.toString(), {
      method: 'GET',
      headers: proxyHeaders,
    });
    
    // Return the proxy response
    const content = await proxyResponse.arrayBuffer();
    const responseHeaders = new Headers();
    
    // Copy relevant headers from proxy response
    proxyResponse.headers.forEach((value, key) => {
      if (!key.toLowerCase().startsWith('x-') && key.toLowerCase() !== 'server') {
        responseHeaders.set(key, value);
      }
    });
    
    // Ensure CORS headers
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return new NextResponse(content, {
      status: proxyResponse.status,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('Error in asset catch-all route:', error);
    
    // Return appropriate fallback based on file type
    const originalPath = '/asset/' + params.path.join('/');
    
    if (originalPath.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i)) {
      // Return placeholder image
      const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#f8f9fa" stroke="#dee2e6"/>
        <text x="50" y="50" text-anchor="middle" font-size="12" fill="#6c757d">Asset</text>
        <text x="50" y="65" text-anchor="middle" font-size="8" fill="#6c757d">Not Found</text>
      </svg>`;
      
      return new NextResponse(placeholderSvg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } else if (originalPath.endsWith('.js') || originalPath.endsWith('.js.br')) {
      // Return empty JS
      return new NextResponse('// Asset file not found', {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } else if (originalPath.endsWith('.css') || originalPath.endsWith('.css.br')) {
      // Return empty CSS
      return new NextResponse('/* Asset file not found */', {
        status: 200,
        headers: {
          'Content-Type': 'text/css',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    return new NextResponse('Asset Not Found', { status: 404 });
  }
}

// Handle other HTTP methods
export async function POST(
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

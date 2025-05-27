import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

/**
 * Catch-all route for /js/ paths from various games
 * This handles direct requests to JavaScript paths and redirects them through the proxy
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the original path from the segments
    const originalPath = '/js/' + params.path.join('/');
    
    console.log(`JS catch-all intercepted: ${originalPath}`);
    
    // Default to venge.io for /js/ paths (most IO games use this structure)
    const baseUrl = 'https://venge.io';
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
    
    // Ensure CORS headers and correct content type
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    responseHeaders.set('Content-Type', 'application/javascript');
    
    return new NextResponse(content, {
      status: proxyResponse.status,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('Error in JS catch-all route:', error);
    
    // Return empty JS file to prevent errors
    return new NextResponse('// JS file not found', {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
      },
    });
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

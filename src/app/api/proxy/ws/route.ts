import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

/**
 * WebSocket proxy endpoint for real-time connections
 * This handles WebSocket connections for games like Venge.io
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return new NextResponse('Missing WebSocket URL parameter', { status: 400 });
  }

  try {
    // Decode the WebSocket URL
    let decodedUrl = decodeURIComponent(url);
    
    // Ensure we're using secure WebSocket (wss://) for encryption
    if (decodedUrl.startsWith('ws://')) {
      decodedUrl = decodedUrl.replace('ws://', 'wss://');
      console.log(`Upgraded WebSocket to secure: ${decodedUrl}`);
    }
    
    // Validate the WebSocket URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(decodedUrl);
    } catch {
      return new NextResponse('Invalid WebSocket URL format', { status: 400 });
    }

    // Only allow WebSocket protocols
    if (!['ws:', 'wss:'].includes(targetUrl.protocol)) {
      return new NextResponse('Only WebSocket protocols are allowed', { status: 400 });
    }

    // For security, ensure we're using encrypted WebSockets
    if (targetUrl.protocol === 'ws:') {
      targetUrl.protocol = 'wss:';
      decodedUrl = targetUrl.toString();
      console.log(`Force upgraded to secure WebSocket: ${decodedUrl}`);
    }

    // Block local/private IP addresses for security
    const hostname = targetUrl.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname === '0.0.0.0' ||
      hostname.includes('local')
    ) {
      return new NextResponse('Access to local WebSocket addresses is not allowed', { status: 403 });
    }

    // Return WebSocket connection info
    // Note: Actual WebSocket proxying requires server-side WebSocket handling
    // For now, we'll return connection details that the client can use
    return new NextResponse(JSON.stringify({
      success: true,
      websocketUrl: decodedUrl,
      protocol: 'wss',
      encrypted: true,
      message: 'WebSocket connection details - use client-side connection'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Error in WebSocket proxy endpoint:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

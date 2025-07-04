import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { hasScholarPlusAccess } from '@/utils/supabase/subscription-check';

export const dynamic = "force-dynamic";

// Rate limiting configuration
const RATE_LIMITING_ENABLED = true; // Toggle to enable/disable rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per minute per IP
const RATE_LIMIT_MAX_REQUESTS_PER_URL = 10; // Max requests per minute per URL

// Anti-spam configuration for aggressive websites
const ANTI_SPAM_ENABLED = true;
const spamBlockedDomains = new Map<string, { blockedUntil: number; reason: string }>();
const domainRequestCounts = new Map<string, { count: number; resetTime: number; violations: number }>();
const DOMAIN_SPAM_THRESHOLD = 50; // Max requests per minute per domain
const DOMAIN_VIOLATION_THRESHOLD = 3; // Number of violations before blocking
const DOMAIN_BLOCK_DURATION = 10 * 60 * 1000; // 10 minutes block
const AGGRESSIVE_SPAM_THRESHOLD = 100; // Immediate block threshold

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  
  // Cleanup rate limit entries
  Array.from(rateLimitMap.entries()).forEach(([key, value]) => {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  });
  
  // Cleanup domain request counts
  Array.from(domainRequestCounts.entries()).forEach(([key, value]) => {
    if (now > value.resetTime) {
      domainRequestCounts.delete(key);
    }
  });
  
  // Cleanup expired domain blocks
  Array.from(spamBlockedDomains.entries()).forEach(([domain, blockInfo]) => {
    if (now > blockInfo.blockedUntil) {
      console.log(`Unblocking domain: ${domain} (block expired)`);
      spamBlockedDomains.delete(domain);
    }
  });
}, 5 * 60 * 1000); // Cleanup every 5 minutes

function checkRateLimit(identifier: string, maxRequests: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Reset or create new entry
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  entry.count++;
  return true;
}

function checkDomainSpam(domain: string, clientIP: string): { allowed: boolean; reason?: string } {
  if (!ANTI_SPAM_ENABLED) {
    return { allowed: true };
  }

  const now = Date.now();

  // Check if domain is currently blocked
  const blockInfo = spamBlockedDomains.get(domain);
  if (blockInfo && now < blockInfo.blockedUntil) {
    return { 
      allowed: false, 
      reason: `Domain ${domain} is temporarily blocked: ${blockInfo.reason}. Block expires in ${Math.ceil((blockInfo.blockedUntil - now) / 60000)} minutes.`
    };
  }

  // Track domain request counts
  const domainKey = `domain:${domain}`;
  const domainEntry = domainRequestCounts.get(domainKey);

  if (!domainEntry || now > domainEntry.resetTime) {
    // Reset or create new entry
    domainRequestCounts.set(domainKey, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
      violations: domainEntry?.violations || 0
    });
    return { allowed: true };
  }

  domainEntry.count++;

  // Check for aggressive spam (immediate block)
  if (domainEntry.count >= AGGRESSIVE_SPAM_THRESHOLD) {
    const reason = `Aggressive spam detected (${domainEntry.count} requests in 1 minute)`;
    spamBlockedDomains.set(domain, {
      blockedUntil: now + DOMAIN_BLOCK_DURATION,
      reason: reason
    });
    console.log(`🚫 BLOCKED DOMAIN: ${domain} - ${reason} (IP: ${clientIP})`);
    return { allowed: false, reason: `Domain ${domain} blocked for aggressive spam behavior.` };
  }

  // Check for spam threshold violation
  if (domainEntry.count >= DOMAIN_SPAM_THRESHOLD) {
    domainEntry.violations++;
    console.log(`⚠️  SPAM WARNING: ${domain} exceeded threshold (${domainEntry.count} requests, violation #${domainEntry.violations}) (IP: ${clientIP})`);

    // Block domain after multiple violations
    if (domainEntry.violations >= DOMAIN_VIOLATION_THRESHOLD) {
      const reason = `Multiple spam violations (${domainEntry.violations} violations)`;
      spamBlockedDomains.set(domain, {
        blockedUntil: now + DOMAIN_BLOCK_DURATION,
        reason: reason
      });
      console.log(`🚫 BLOCKED DOMAIN: ${domain} - ${reason} (IP: ${clientIP})`);
      return { allowed: false, reason: `Domain ${domain} blocked for repeated spam violations.` };
    }

    return { allowed: false, reason: `Domain ${domain} is sending too many requests. Please slow down.` };
  }

  return { allowed: true };
}

/**
 * Enhanced web proxy endpoint for the proxy browser tool
 * Handles HTML pages, API requests, static assets, and more
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication and subscription check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse('Authentication required', { status: 401 });
    }

    // Check if user has Scholar+ access (regular or temporary)
    const hasAccess = await hasScholarPlusAccess(user.id);

    if (!hasAccess) {
      return new NextResponse('Scholar+ subscription required', { status: 403 });
    }

    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Apply rate limiting if enabled
    if (RATE_LIMITING_ENABLED) {
      // Rate limit by IP
      if (!checkRateLimit(`ip:${clientIP}`, RATE_LIMIT_MAX_REQUESTS)) {
        console.log(`Rate limit exceeded for IP: ${clientIP}`);
        return new NextResponse('Rate limit exceeded. Please slow down.', {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Date.now() + RATE_LIMIT_WINDOW).toString(),
          }
        });
      }

      // Rate limit by URL to prevent spam requests to the same resource
      const urlKey = `url:${url}`;
      if (!checkRateLimit(urlKey, RATE_LIMIT_MAX_REQUESTS_PER_URL)) {
        console.log(`Rate limit exceeded for URL: ${url}`);
        return new NextResponse('Too many requests to this URL. Please wait.', {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS_PER_URL.toString(),
            'X-RateLimit-Remaining': '0',
          }
        });
      }
    }

    // Decode the URL if it's encoded (handle double encoding and HTML entities)
    let decodedUrl = decodeURIComponent(url);

    // Handle HTML entities safely to prevent double-unescaping
    // Process in a specific order to avoid conflicts
    decodedUrl = decodedUrl
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&'); // Process &amp; last to prevent double-unescaping

    // Handle relative URLs by detecting the referrer
    let targetUrl: URL;
    try {
      targetUrl = new URL(decodedUrl);
    } catch {
      // If URL parsing fails, it might be a relative URL
      // Try to construct it using the referrer header
      const referer = request.headers.get('referer');
      if (referer && decodedUrl.startsWith('/')) {
        try {
          // Extract the base URL from the referrer
          const refererUrl = new URL(referer);

          // Check if the referrer is our proxy browser page
          if (refererUrl.pathname.startsWith('/dashboard/tools/proxy-browser')) {
            // For relative URLs from the proxy browser, try common domains
            // This is a fallback for when URL rewriting doesn't work (like with Vue.js apps)
            let baseUrl = 'https://venge.io'; // Default to venge.io for most IO game assets

            // Try to detect the intended domain from the URL pattern
            if (decodedUrl.includes('/img/') || decodedUrl.includes('/js/') || decodedUrl.includes('/css/')) {
              // Check if there's a current URL in the browser that we can use
              const userAgent = request.headers.get('user-agent') || '';
              if (userAgent.includes('venge') || referer.includes('venge')) {
                baseUrl = 'https://venge.io';
              }
            }

            const fullUrl = `${baseUrl}${decodedUrl}`;
            console.log(`Converting relative URL ${decodedUrl} to ${fullUrl} (fallback to ${baseUrl})`);
            targetUrl = new URL(fullUrl);
            decodedUrl = fullUrl; // Update decodedUrl for the rest of the function
          } else {
            // Try to use the referrer's origin as the base
            const fullUrl = `${refererUrl.protocol}//${refererUrl.host}${decodedUrl}`;
            console.log(`Converting relative URL ${decodedUrl} to ${fullUrl} based on referrer origin`);
            targetUrl = new URL(fullUrl);
            decodedUrl = fullUrl;
          }
        } catch {
          return new NextResponse('Invalid relative URL - could not construct full URL', { status: 400 });
        }
      } else {
        return new NextResponse('Invalid URL format', { status: 400 });
      }
    }

    // Security: Block certain protocols and local addresses
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return new NextResponse('Only HTTP and HTTPS protocols are allowed', { status: 400 });
    }

    // Block access to our own domain to prevent recursion and confusion
    const hostname = targetUrl.hostname.toLowerCase();
    const currentDomain = process.env.NEXT_PUBLIC_DOMAIN;
    if ((currentDomain && hostname.includes(currentDomain)) || hostname.includes('localhost:3000') || hostname.includes('127.0.0.1:3000')) {
      return new NextResponse('Access to UniShare domains is not allowed through the proxy', { status: 403 });
    }

    // Block local/private IP addresses for security
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname === '0.0.0.0' ||
      hostname.includes('local')
    ) {
      return new NextResponse('Access to local addresses is not allowed', { status: 403 });
    }

    // Check for domain-level spam and blocking
    const domainSpamCheck = checkDomainSpam(hostname, clientIP);
    if (!domainSpamCheck.allowed) {
      console.log(`Domain spam check failed for ${hostname}: ${domainSpamCheck.reason}`);
      return new NextResponse(domainSpamCheck.reason || 'Domain temporarily blocked', {
        status: 429,
        headers: {
          'Retry-After': '600', // 10 minutes
          'X-Blocked-Domain': hostname,
          'X-Block-Reason': 'Spam protection',
        }
      });
    }

    // Block known problematic domains that cause DNS issues
    const blockedDomains = [
      'sentry.end.gg',
      'analytics.google.com',
      'googletagmanager.com',
      'facebook.com/tr',
      'doubleclick.net',
      'googlesyndication.com',
      'google-analytics.com',
      'googleadservices.com',
      'googletag',
      'adsystem.google.com'
    ];

    if (blockedDomains.some(domain => hostname.includes(domain))) {
      console.log(`Blocked request to: ${hostname}`);
      // Return appropriate empty response based on expected content type
      if (decodedUrl.includes('.js')) {
        return new NextResponse('// Blocked analytics/tracking request', {
          status: 200,
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } else {
        return new NextResponse(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // Build headers to mimic a real browser request
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
    };

    // Add referer header to make the request look legitimate
    headers['Referer'] = targetUrl.origin + '/';

    // For font files, use appropriate headers
    if (decodedUrl.includes('.woff') || decodedUrl.includes('.ttf') || decodedUrl.includes('.otf')) {
      headers['Accept'] = 'font/woff2,font/woff,font/ttf,*/*;q=0.1';
      headers['Sec-Fetch-Dest'] = 'font';
      headers['Sec-Fetch-Mode'] = 'cors';
      headers['Sec-Fetch-Site'] = 'same-origin';
    }

    // For CSS files
    if (decodedUrl.includes('.css')) {
      headers['Accept'] = 'text/css,*/*;q=0.1';
      headers['Sec-Fetch-Dest'] = 'style';
      headers['Sec-Fetch-Mode'] = 'no-cors';
      headers['Sec-Fetch-Site'] = 'same-origin';
    }

    // For JS files (including compressed .br files)
    if (decodedUrl.includes('.js') || decodedUrl.includes('.js.br')) {
      headers['Accept'] = '*/*';
      headers['Accept-Encoding'] = 'gzip, deflate, br'; // Support Brotli compression
      headers['Sec-Fetch-Dest'] = 'script';
      headers['Sec-Fetch-Mode'] = 'no-cors';
      headers['Sec-Fetch-Site'] = 'same-origin';
    }

    // For images
    if (decodedUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
      headers['Accept'] = 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8';
      headers['Sec-Fetch-Dest'] = 'image';
      headers['Sec-Fetch-Mode'] = 'no-cors';
      headers['Sec-Fetch-Site'] = 'same-origin';
    }

    // Determine timeout based on content type - IO games need more time
    const isIOGame = hostname.includes('.io') ||
                     hostname.includes('game') ||
                     decodedUrl.includes('game') ||
                     hostname.includes('agar') ||
                     hostname.includes('slither') ||
                     hostname.includes('diep');

    const timeout = isIOGame ? 45000 : 30000; // 45 seconds for IO games, 30 for others

    // Fetch the web content with explicit redirect handling
    const response = await fetch(decodedUrl, {
      headers,
      // Set a timeout to prevent hanging requests
      signal: AbortSignal.timeout(timeout),
      // Explicitly follow redirects (this is the default, but being explicit)
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error(`Error fetching web content: ${response.status} ${response.statusText} for URL: ${decodedUrl}`);

      // For 403 errors on fonts, try alternative sources or provide fallback
      if (response.status === 403 && (decodedUrl.includes('.woff') || decodedUrl.includes('.ttf'))) {
        console.log('Font blocked by 403, trying fallback strategies');

        // Try Google Fonts for common fonts
        let fallbackUrl = null;
        if (decodedUrl.includes('Lato')) {
          fallbackUrl = 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXiWtFCc.woff2';
        } else if (decodedUrl.includes('NotoSans')) {
          fallbackUrl = 'https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNr5TRASf6M7Q.woff2';
        }

        if (fallbackUrl) {
          try {
            console.log('Trying Google Fonts fallback:', fallbackUrl);
            const fallbackResponse = await fetch(fallbackUrl, {
              headers: {
                'User-Agent': headers['User-Agent'],
                'Accept': 'font/woff2,font/woff,*/*;q=0.1',
                'Referer': 'https://fonts.googleapis.com/',
              },
              signal: AbortSignal.timeout(10000),
            });

            if (fallbackResponse.ok) {
              const fontBuffer = await fallbackResponse.arrayBuffer();
              return new NextResponse(fontBuffer, {
                status: 200,
                headers: {
                  'Content-Type': 'font/woff2',
                  'Cache-Control': 'public, max-age=86400',
                  'Access-Control-Allow-Origin': '*',
                },
              });
            }
          } catch (fallbackError) {
            console.log('Google Fonts fallback failed:', fallbackError);
          }
        }

        // If all else fails, return an empty font file
        console.log('All font fallbacks failed, returning empty font');
        const emptyFontBuffer = new ArrayBuffer(0);
        return new NextResponse(emptyFontBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'font/woff2',
            'Content-Length': '0',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // For 403 errors on images/SVGs, provide fallback icons
      if (response.status === 403 && (decodedUrl.includes('.svg') || decodedUrl.includes('/images/'))) {
        console.log('Image/SVG blocked by 403, providing fallback icon');

        // Create a simple fallback SVG based on the icon type
        let fallbackSvg = '';

        if (decodedUrl.includes('arrow') || decodedUrl.includes('caret')) {
          fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>`;
        } else if (decodedUrl.includes('magnifying-glass') || decodedUrl.includes('search')) {
          fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>`;
        } else if (decodedUrl.includes('facebook')) {
          fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>`;
        } else if (decodedUrl.includes('twitter')) {
          fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>`;
        } else if (decodedUrl.includes('instagram')) {
          fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>`;
        } else {
          // Generic fallback icon
          fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>`;
        }

        return new NextResponse(fallbackSvg, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // For 404 errors on images, provide placeholder images
      if (response.status === 404 && (decodedUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) || decodedUrl.includes('/img/') || decodedUrl.includes('/images/'))) {
        console.log('Image not found (404), providing placeholder');

        // Create a simple placeholder SVG
        const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="#f0f0f0">
          <rect width="100" height="100" fill="#f8f9fa" stroke="#dee2e6" stroke-width="1"/>
          <path d="M30 35h40v30H30z" fill="#6c757d" opacity="0.3"/>
          <circle cx="40" cy="45" r="3" fill="#6c757d"/>
          <path d="M35 60l8-8 4 4 8-8 10 10v2H35z" fill="#6c757d"/>
          <text x="50" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#6c757d">Image</text>
        </svg>`;

        return new NextResponse(placeholderSvg, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // For 404 errors on JS/CSS files (including .br compressed files), return empty content to prevent errors
      if (response.status === 404 && (decodedUrl.includes('.js') || decodedUrl.includes('.css') || decodedUrl.includes('.br'))) {
        console.log('JS/CSS/BR file not found (404), providing empty content');

        let contentType = 'application/javascript';
        let emptyContent = '// File not found';

        if (decodedUrl.includes('.css')) {
          contentType = 'text/css';
          emptyContent = '/* File not found */';
        } else if (decodedUrl.includes('.js.br') || decodedUrl.includes('webgl.framework.js.br')) {
          contentType = 'application/javascript';
          emptyContent = '// Compressed JS file not found';
        }

        return new NextResponse(emptyContent, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      return new NextResponse(`Failed to fetch content: ${response.status} ${response.statusText}`, {
        status: response.status
      });
    }

    // Get the content type
    let contentType = response.headers.get('content-type') || 'text/html';

    // Override content type based on URL extension to ensure correct MIME type
    if (decodedUrl.endsWith('.js') || decodedUrl.includes('.js?') || decodedUrl.endsWith('.js.br')) {
      contentType = 'application/javascript';
    } else if (decodedUrl.endsWith('.css') || decodedUrl.includes('.css?') || decodedUrl.endsWith('.css.br')) {
      contentType = 'text/css';
    } else if (decodedUrl.endsWith('.json') || decodedUrl.includes('.json?')) {
      contentType = 'application/json';
    }

    // Handle different content types
    if (contentType.includes('text/html')) {
      // Handle HTML content
      let htmlContent = await response.text();
      htmlContent = modifyHtmlForProxy(htmlContent, targetUrl);

      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Frame-Options': 'SAMEORIGIN',
          'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' *; frame-ancestors 'self';",
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } else if (contentType.includes('application/json') || contentType.includes('text/plain')) {
      // Handle JSON/API responses
      const content = await response.text();
      return new NextResponse(content, {
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    } else if (contentType.includes('text/css') || contentType === 'text/css') {
      // Handle CSS files
      let cssContent = await response.text();
      cssContent = modifyCssForProxy(cssContent, targetUrl);

      return new NextResponse(cssContent, {
        headers: {
          'Content-Type': 'text/css; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } else if (contentType.includes('application/javascript') || contentType.includes('text/javascript') || contentType === 'application/javascript') {
      // Handle JavaScript files
      let jsContent = await response.text();
      jsContent = modifyJsForProxy(jsContent, targetUrl);

      return new NextResponse(jsContent, {
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } else {
      // Handle binary content (images, fonts, etc.)
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  } catch (error: any) {
    console.error('Error in web proxy endpoint:', error);

    if (error.name === 'TimeoutError') {
      return new NextResponse('Request timeout - the website took too long to respond', { status: 504 });
    }

    // Handle DNS resolution failures (common with IO games)
    if (error.code === 'ENOTFOUND' || error.message?.includes('getaddrinfo ENOTFOUND')) {
      console.log(`DNS resolution failed for: ${error.hostname || 'unknown'}`);
      return new NextResponse('// DNS resolution failed - domain not found', {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Handle network connection failures
    if (error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
      console.log('Network connection failed');
      return new NextResponse('// Network connection failed', {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * Handle POST requests for API calls, form submissions, etc.
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication and subscription check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse('Authentication required', { status: 401 });
    }

    // Check if user has Scholar+ access (regular or temporary)
    const hasAccess = await hasScholarPlusAccess(user.id);

    if (!hasAccess) {
      return new NextResponse('Scholar+ subscription required', { status: 403 });
    }

    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Apply rate limiting if enabled
    if (RATE_LIMITING_ENABLED) {
      // Rate limit by IP (stricter for POST requests)
      if (!checkRateLimit(`ip:${clientIP}:post`, RATE_LIMIT_MAX_REQUESTS / 2)) {
        console.log(`POST rate limit exceeded for IP: ${clientIP}`);
        return new NextResponse('Rate limit exceeded for POST requests.', {
          status: 429,
          headers: {
            'Retry-After': '60',
          }
        });
      }

      // Rate limit by URL for POST requests
      const urlKey = `url:${url}:post`;
      if (!checkRateLimit(urlKey, RATE_LIMIT_MAX_REQUESTS_PER_URL / 2)) {
        console.log(`POST rate limit exceeded for URL: ${url}`);
        return new NextResponse('Too many POST requests to this URL.', {
          status: 429,
          headers: {
            'Retry-After': '60',
          }
        });
      }
    }

    // Decode the URL if it's encoded (handle double encoding and HTML entities)
    let decodedUrl = decodeURIComponent(url);

    // Handle HTML entities safely to prevent double-unescaping
    // Process in a specific order to avoid conflicts
    decodedUrl = decodedUrl
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&'); // Process &amp; last to prevent double-unescaping

    // Security validation (same as GET)
    let targetUrl: URL;
    try {
      targetUrl = new URL(decodedUrl);
    } catch {
      return new NextResponse('Invalid URL format', { status: 400 });
    }

    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return new NextResponse('Only HTTP and HTTPS protocols are allowed', { status: 400 });
    }

    // Block access to our own domain to prevent recursion and confusion
    const hostname = targetUrl.hostname.toLowerCase();
    const currentDomain = process.env.NEXT_PUBLIC_DOMAIN;
    if ((currentDomain && hostname.includes(currentDomain)) || hostname.includes('localhost:3000') || hostname.includes('127.0.0.1:3000')) {
      return new NextResponse('Access to UniShare domains is not allowed through the proxy', { status: 403 });
    }

    // Block local/private IP addresses for security
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname === '0.0.0.0' ||
      hostname.includes('local')
    ) {
      return new NextResponse('Access to local addresses is not allowed', { status: 403 });
    }

    // Check for domain-level spam and blocking
    const domainSpamCheck = checkDomainSpam(hostname, clientIP);
    if (!domainSpamCheck.allowed) {
      console.log(`Domain spam check failed for ${hostname}: ${domainSpamCheck.reason}`);
      return new NextResponse(domainSpamCheck.reason || 'Domain temporarily blocked', {
        status: 429,
        headers: {
          'Retry-After': '600', // 10 minutes
          'X-Blocked-Domain': hostname,
          'X-Block-Reason': 'Spam protection',
        }
      });
    }

    // Block known problematic domains that cause DNS issues
    const blockedDomains = [
      'sentry.end.gg',
      'analytics.google.com',
      'googletagmanager.com',
      'facebook.com/tr',
      'doubleclick.net',
      'googlesyndication.com',
      'google-analytics.com',
      'googleadservices.com',
      'googletag',
      'adsystem.google.com'
    ];

    if (blockedDomains.some(domain => hostname.includes(domain))) {
      console.log(`Blocked POST request to: ${hostname}`);
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Get request body and headers
    const body = await request.arrayBuffer();
    const contentType = request.headers.get('content-type') || 'application/json';

    // Forward the POST request
    const response = await fetch(decodedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Origin': targetUrl.origin,
        'Referer': targetUrl.href,
      },
      body: body.byteLength > 0 ? body : undefined,
      signal: AbortSignal.timeout(30000),
      // Follow redirects for POST requests too
      redirect: 'follow',
    });

    const responseContentType = response.headers.get('content-type') || 'application/json';

    // Handle 204 No Content responses (they can't have a body)
    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': responseContentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    console.error('Error in POST proxy endpoint:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * Handle HEAD requests for connectivity testing
 */
export async function HEAD(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse(null, { status: 400 });
  }

  // Basic validation
  try {
    const targetUrl = new URL(decodeURIComponent(url));
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return new NextResponse(null, { status: 400 });
    }
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Modify HTML content to work better in the proxy environment
 */
function modifyHtmlForProxy(html: string, targetUrl: URL): string {
  const baseUrl = `${targetUrl.protocol}//${targetUrl.host}`;

  // Full proxy injection for all websites
  const proxyInjection = `
    <style>
      /* Prevent the page from breaking out of iframe */
      html, body {
        max-width: 100% !important;
        overflow-x: auto !important;
      }
      /* Hide elements that might cause issues */
      iframe[src*="google.com/recaptcha"],
      iframe[src*="facebook.com"],
      iframe[src*="twitter.com"] {
        display: none !important;
      }
    </style>
    <script>
      // Full proxy injection for non-Vue apps
      (function() {
        const originalFetch = window.fetch;
        const originalXHR = window.XMLHttpRequest;
        const proxyBase = '/api/proxy/web?url=';

        // Override fetch to route through proxy
        window.fetch = function(url, options = {}) {
          if (typeof url === 'string') {
            // Skip localhost URLs and our own proxy URLs
            if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('/api/proxy/web')) {
              return originalFetch(url, options);
            }

            // Skip data URLs, blob URLs, and dangerous script URLs
            const dangerousSchemes = ['javascript:', 'vbscript:', 'data:', 'blob:', 'file:', 'ftp:'];
            if (dangerousSchemes.some(scheme => url.toLowerCase().startsWith(scheme))) {
              return originalFetch(url, options);
            }

            if (url.startsWith('http') || url.startsWith('//')) {
              const fullUrl = url.startsWith('//') ? 'https:' + url : url;
              const proxyUrl = proxyBase + encodeURIComponent(fullUrl);
              return originalFetch(proxyUrl, options);
            } else if (url.startsWith('/') && !url.startsWith('//')) {
              // Handle relative URLs - route through proxy to the original domain
              const fullUrl = '${baseUrl}' + url;
              const proxyUrl = proxyBase + encodeURIComponent(fullUrl);
              return originalFetch(proxyUrl, options);
            } else if (url && !url.startsWith('#')) {
              // Handle relative URLs without leading slash
              const fullUrl = '${baseUrl}/' + url;
              const proxyUrl = proxyBase + encodeURIComponent(fullUrl);
              return originalFetch(proxyUrl, options);
            }
          }
          return originalFetch(url, options);
        };

        // Override XMLHttpRequest
        const OriginalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
          const xhr = new OriginalXHR();
          const originalOpen = xhr.open;

          xhr.open = function(method, url, ...args) {
            if (typeof url === 'string') {
              // Skip localhost URLs and our own proxy URLs
              if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('/api/proxy/web')) {
                return originalOpen.call(this, method, url, ...args);
              }

              // Skip data URLs, blob URLs, and dangerous script URLs
              const dangerousSchemes = ['javascript:', 'vbscript:', 'data:', 'blob:', 'file:', 'ftp:'];
              if (dangerousSchemes.some(scheme => url.toLowerCase().startsWith(scheme))) {
                return originalOpen.call(this, method, url, ...args);
              }

              if (url.startsWith('http') || url.startsWith('//')) {
                const fullUrl = url.startsWith('//') ? 'https:' + url : url;
                url = proxyBase + encodeURIComponent(fullUrl);
              } else if (url.startsWith('/') && !url.startsWith('//')) {
                // Handle relative URLs - route through proxy to the original domain
                const fullUrl = '${baseUrl}' + url;
                url = proxyBase + encodeURIComponent(fullUrl);
              } else if (url && !url.startsWith('#')) {
                // Handle relative URLs without leading slash
                const fullUrl = '${baseUrl}/' + url;
                url = proxyBase + encodeURIComponent(fullUrl);
              }
            }
            return originalOpen.call(this, method, url, ...args);
          };

          return xhr;
        };

        // Override WebSocket to use encrypted connections
        const OriginalWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
          console.log('WebSocket connection attempt:', url);

          // Convert to secure WebSocket URL
          let wsUrl = url;
          if (typeof url === 'string') {
            // Ensure we're using secure WebSocket (wss://)
            if (url.startsWith('ws://')) {
              wsUrl = url.replace('ws://', 'wss://');
              console.log('Upgraded WebSocket to secure:', wsUrl);
            } else if (url.startsWith('/')) {
              // Handle relative WebSocket URLs
              wsUrl = 'wss://' + '${baseUrl}'.replace('https://', '').replace('http://', '') + url;
              console.log('Converted relative WebSocket URL:', wsUrl);
            }

            // For Venge.io and other IO games, connect directly with encryption
            if (wsUrl.includes('venge.io') || wsUrl.includes('.io')) {
              console.log('Connecting to IO game WebSocket with encryption:', wsUrl);
              return new OriginalWebSocket(wsUrl, protocols);
            }
          }

          // For other WebSockets, try to connect with encryption
          try {
            return new OriginalWebSocket(wsUrl, protocols);
          } catch (error) {
            console.error('WebSocket connection failed:', error);
            // Return a mock WebSocket that logs attempts
            return {
              send: (data) => console.log('WebSocket send attempt:', data),
              close: () => console.log('WebSocket close attempt'),
              addEventListener: (event, handler) => console.log('WebSocket event listener:', event),
              removeEventListener: (event, handler) => console.log('WebSocket remove listener:', event),
              readyState: 3, // CLOSED
              url: wsUrl,
              protocol: '',
              extensions: '',
              bufferedAmount: 0,
              binaryType: 'blob'
            };
          }
        };

        // Override window.open to prevent popups
        window.open = function(url) {
          if (url && (url.startsWith('http') || url.startsWith('//'))) {
            const fullUrl = url.startsWith('//') ? 'https:' + url : url;
            window.parent.postMessage({
              type: 'proxy-navigate',
              url: fullUrl
            }, '*');
          }
          return null;
        };

        // Prevent websites from redirecting the parent window
        const originalLocationAssign = window.location.assign;
        const originalLocationReplace = window.location.replace;
        const originalLocationReload = window.location.reload;

        window.location.assign = function(url) {
          console.log('Blocked location.assign attempt:', url);
          return false;
        };

        window.location.replace = function(url) {
          console.log('Blocked location.replace attempt:', url);
          return false;
        };

        window.location.reload = function() {
          console.log('Blocked location.reload attempt');
          return false;
        };

        // Prevent setting window.location.href directly
        try {
          Object.defineProperty(window.location, 'href', {
            set: function(url) {
              console.log('Blocked location.href assignment:', url);
              return false;
            },
            get: function() {
              return window.location.toString();
            }
          });
        } catch (e) {
          // Some browsers don't allow this, that's okay
        }

        // Prevent top-level navigation attempts
        if (window.top !== window.self) {
          try {
            window.top.location = window.location;
          } catch (e) {
            // This will fail due to same-origin policy, which is what we want
          }
        }

        // Intercept all form submissions to ensure the proxy URL is used
        document.addEventListener('submit', function(e) {
          const form = e.target;
          if (form.tagName === 'FORM') {
            e.preventDefault();
            let action = form.getAttribute('action') || window.location.pathname + window.location.search;

            // If the action is already a proxy URL, extract the real target URL
            const proxyPrefix = '/api/proxy/web?url=';
            if (action.startsWith(proxyPrefix)) {
              const urlParam = action.slice(proxyPrefix.length);
              const [encodedUrl] = urlParam.split('&');
              action = decodeURIComponent(encodedUrl || '');
              if (!action) action = window.location.origin;
            } else if (action.startsWith('/')) {
              // If action is a relative path, make it absolute using the original domain
              action = window.location.origin + action;
            } else if (!action.startsWith('http')) {
              // Make it absolute using the current location
              action = window.location.origin + '/' + action;
            }

            // Build the form data as a query string
            const formData = new FormData(form);
            const params = new URLSearchParams();
            for (const [key, value] of formData.entries()) {
              params.append(key, value);
            }
            // Append form data to the action URL
            const urlWithParams = action + (action.includes('?') ? '&' : '?') + params.toString();
            // Redirect through the proxy
            window.location.href = '/api/proxy/web?url=' + encodeURIComponent(urlWithParams);
          }
        }, true);

        // Intercept all click events on <a> tags to ensure proxying
        document.addEventListener('click', function(e) {
          let el = e.target;
          while (el && el.tagName !== 'A') el = el.parentElement;
          if (el && el.tagName === 'A' && el.href) {
            const href = el.getAttribute('href');
            const dangerousSchemes = ['javascript:', 'vbscript:', 'data:', 'blob:', 'file:', 'ftp:'];
            if (href && !href.startsWith('#') && !dangerousSchemes.some(scheme => href.toLowerCase().startsWith(scheme))) {
              e.preventDefault();
              let targetUrl = href;
              if (href.startsWith('/')) {
                targetUrl = window.location.origin + href;
              } else if (!href.startsWith('http')) {
                targetUrl = window.location.origin + '/' + href;
              }
              window.location.href = '/api/proxy/web?url=' + encodeURIComponent(targetUrl);
            }
          }
        }, true);
      })();
    </script>
  `;

  // Insert injection before closing head tag or at the beginning
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${proxyInjection}</head>`);
  } else {
    html = `${proxyInjection}${html}`;
  }

  // Rewrite URLs in HTML for all websites
  html = rewriteUrlsInHtml(html, baseUrl);

  return html;
}

/**
 * Rewrite URLs in HTML attributes to go through proxy
 */
function rewriteUrlsInHtml(html: string, baseUrl: string): string {
  const proxyBase = '/api/proxy/web?url=';

  // Helper function to rewrite a URL
  const rewriteUrl = (url: string): string => {
    // Skip data URLs, blob URLs, and dangerous script URLs, anchors
    const dangerousSchemes = ['javascript:', 'vbscript:', 'data:', 'blob:', 'file:', 'ftp:'];
    if (url.startsWith('#') || dangerousSchemes.some(scheme => url.toLowerCase().startsWith(scheme))) {
      return url;
    }
    if (url.startsWith('http') || url.startsWith('//')) {
      const fullUrl = url.startsWith('//') ? 'https:' + url : url;
      return `${proxyBase}${encodeURIComponent(fullUrl)}`;
    } else if (url.startsWith('/')) {
      const fullUrl = baseUrl + url;
      return `${proxyBase}${encodeURIComponent(fullUrl)}`;
    } else if (url && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
      // Handle relative URLs (like "image.jpg" or "css/style.css")
      const fullUrl = baseUrl + '/' + url;
      return `${proxyBase}${encodeURIComponent(fullUrl)}`;
    }
    return url;
  };

  // Rewrite src attributes (images, scripts, etc.)
  html = html.replace(/src=["']([^"']+)["']/g, (match, url) => {
    const newUrl = rewriteUrl(url);
    return `src="${newUrl}"`;
  });

  // Rewrite href attributes for stylesheets and links
  html = html.replace(/href=["']([^"']+)["']/g, (match, url) => {
    const newUrl = rewriteUrl(url);
    return `href="${newUrl}"`;
  });

  // Rewrite action attributes in forms
  html = html.replace(/action=["']([^"']+)["']/g, (match, url) => {
    const newUrl = rewriteUrl(url);
    return `action="${newUrl}"`;
  });

  // Rewrite srcset attributes (for responsive images)
  html = html.replace(/srcset=["']([^"']+)["']/g, (match, srcset) => {
    // srcset can have multiple URLs separated by commas
    const rewritten = srcset.split(',').map((part: string) => {
      const [url, descriptor] = part.trim().split(/\s+/, 2);
      return `${rewriteUrl(url)}${descriptor ? ' ' + descriptor : ''}`;
    }).join(', ');
    return `srcset="${rewritten}"`;
  });

  // Rewrite <meta http-equiv="refresh" content="...url=..."> tags
  html = html.replace(/(<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"'>]*url=)([^"'>]+)(["'][^>]*>)/gi, (match, before, url, after) => {
    return `${before}${rewriteUrl(url)}${after}`;
  });

  // TODO: Optionally rewrite inline event handlers, data-* attributes, etc.
  // TODO: Optionally rewrite inline JS (complex, not always needed)

  return html;
}

/**
 * Modify CSS content to work with proxy
 */
function modifyCssForProxy(css: string, targetUrl: URL): string {
  const baseUrl = `${targetUrl.protocol}//${targetUrl.host}`;
  const proxyBase = '/api/proxy/web?url=';

  // Rewrite url() references in CSS
  css = css.replace(/url\(['"]?([^'")\s]+)['"]?\)/g, (match, url) => {
    if (url.startsWith('http') || url.startsWith('//')) {
      const fullUrl = url.startsWith('//') ? 'https:' + url : url;
      return `url("${proxyBase}${encodeURIComponent(fullUrl)}")`;
    } else if (url.startsWith('/')) {
      const fullUrl = baseUrl + url;
      return `url("${proxyBase}${encodeURIComponent(fullUrl)}")`;
    }
    return match;
  });

  return css;
}

/**
 * Modify JavaScript content to work with proxy
 */
function modifyJsForProxy(js: string, targetUrl: URL): string {
  // For now, just return the JS as-is
  // More sophisticated JS rewriting could be added here
  return js;
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, ArrowLeft, ArrowRight, RotateCcw, Home, Shield, AlertTriangle } from "lucide-react";
import DynamicPageTitle from "@/components/dynamic-page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientSubscriptionCheck } from "@/components/client-subscription-check";
import { SubscriptionRequiredNotice } from "@/components/subscription-required-notice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import SearchBarWithClear from "@/components/search-bar-with-clear";

export default function ProxyBrowserPage() {
  const [url, setUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [proxyStatus, setProxyStatus] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rateLimitMonitorRef = useRef<NodeJS.Timeout | null>(null);
  const requestCountRef = useRef<number>(0);
  const lastRequestTimeRef = useRef<number>(0);
  const isMobile = useMobileDetection();

  // Listen for navigation messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'proxy-navigate' && event.data.url) {
        navigateToUrl(event.data.url);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      // Cleanup timeouts on unmount
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (rateLimitMonitorRef.current) {
        clearInterval(rateLimitMonitorRef.current);
      }
    };
  }, []);

  // Function to check if the proxy response indicates rate limiting
  const checkForRateLimiting = async (url: string): Promise<{ isRateLimited: boolean; message?: string }> => {
    try {
      const proxyUrl = `/api/proxy/web?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl, { method: 'GET' }); // Use GET instead of HEAD to get actual response
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const blockedDomain = response.headers.get('X-Blocked-Domain');
        const blockReason = response.headers.get('X-Block-Reason');
        
        let message = "Rate limit exceeded. Please wait before accessing this website again.";
        
        if (blockedDomain && blockReason === 'Spam protection') {
          message = `The website "${blockedDomain}" has been temporarily blocked due to excessive requests. This helps protect our servers from spam.`;
        } else if (retryAfter) {
          const waitTime = parseInt(retryAfter);
          if (waitTime >= 60) {
            message = `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 60)} minutes before trying again.`;
          } else {
            message = `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`;
          }
        }
        
        return { isRateLimited: true, message };
      }
      
      // Also check response text for rate limiting messages
      const responseText = await response.text();
      if (responseText.includes('Rate limit exceeded') || 
          responseText.includes('Too many requests') ||
          responseText.includes('temporarily blocked') ||
          responseText.includes('Domain temporarily blocked')) {
        
        let message = "Rate limit exceeded. The website has been closed to prevent further issues.";
        if (responseText.includes('Domain') && responseText.includes('temporarily blocked')) {
          // Extract the specific message from the response
          const lines = responseText.split('\n');
          const relevantLine = lines.find(line => line.includes('temporarily blocked'));
          if (relevantLine) {
            message = relevantLine.trim();
          }
        }
        
        return { isRateLimited: true, message };
      }
      
      return { isRateLimited: false };
    } catch (error) {
      console.error('Error checking rate limiting:', error);
      return { isRateLimited: false };
    }
  };

  // Simple function to load iframe with guaranteed 2-second refresh
  const loadIframe = (url: string, retryCount = 0) => {
    console.log(`🔄 Loading iframe (attempt ${retryCount + 1}):`, url);

    if (!iframeRef.current) {
      console.log('❌ ERROR: iframeRef.current is null!');
      return;
    }

    console.log('✅ iframeRef exists, continuing...');

    console.log('🧹 Clearing existing timeouts...');

    // Clear any existing timeouts
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
      console.log('✅ Cleared loadingTimeoutRef');
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
      console.log('✅ Cleared countdownIntervalRef');
    }

    const iframe = iframeRef.current;
    const proxyUrl = `/api/proxy/web?url=${encodeURIComponent(url)}`;
    console.log('🔗 Proxy URL:', proxyUrl);

    let hasLoaded = false;
    let timeLeft = 2.0;

    console.log('⚙️ Setting up iframe handlers...');

    const markAsLoaded = () => {
      if (hasLoaded) return;
      hasLoaded = true;
      console.log('✅ Page loaded successfully');
      setProxyStatus("✓ Secure proxy active");
      setLoading(false);
      setCountdown(0);

      // Clear loading timeouts
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };

    const handleRateLimitDetected = (message: string) => {
      console.log('🚫 Rate limiting detected, closing website');
      hasLoaded = true; // Prevent further retries
      
      // Clear all timeouts and intervals
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (rateLimitMonitorRef.current) {
        clearInterval(rateLimitMonitorRef.current);
        rateLimitMonitorRef.current = null;
      }
      
      // Close the website and show error
      setError(message);
      setProxyStatus("");
      setLoading(false);
      setCountdown(0);
      setCurrentUrl("");
      setUrl("");
      
      // Clear the iframe
      if (iframeRef.current) {
        iframeRef.current.src = "about:blank";
      }
    };

    const forceRefresh = async () => {
      console.log(`⏰ 2 seconds elapsed - checking for rate limiting before refresh (attempt ${retryCount + 1})`);

      // Check for rate limiting before attempting refresh
      const rateLimitCheck = await checkForRateLimiting(url);
      if (rateLimitCheck.isRateLimited) {
        handleRateLimitDetected(rateLimitCheck.message || "Rate limit exceeded");
        return;
      }

      // Clear countdown
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      if (retryCount < 2) {
        // Try again
        console.log(`🔄 Attempting retry ${retryCount + 2}/3`);
        setProxyStatus(`🔄 Auto-refresh ${retryCount + 2}/3`);
        setCountdown(0);

        // Small delay then retry
        setTimeout(() => {
          if (!hasLoaded) {
            loadIframe(url, retryCount + 1);
          }
        }, 300);
      } else {
        // Give up
        console.log('❌ Max retries reached, giving up');
        setProxyStatus("⚠️ Page may not be compatible with proxy");
        setLoading(false);
        setCountdown(0);
      }
    };

    // Set up iframe
    iframe.onload = async () => {
      console.log('📄 Iframe onload event fired');
      
      // Check if the loaded content indicates rate limiting
      try {
        // Try to access the iframe's content to check for rate limiting
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const bodyText = iframeDoc.body?.textContent || '';
          const titleText = iframeDoc.title || '';
          
          // Check for rate limiting indicators in the content
          if (bodyText.includes('Rate limit exceeded') || 
              bodyText.includes('Too many requests') ||
              bodyText.includes('temporarily blocked') ||
              titleText.includes('429') ||
              bodyText.includes('Domain temporarily blocked')) {
            
            console.log('🚫 Rate limiting detected in iframe content');
            
            // Extract message from content if possible
            let message = "Rate limit exceeded. The website has been closed to prevent further issues.";
            if (bodyText.includes('Domain') && bodyText.includes('temporarily blocked')) {
              message = bodyText.trim();
            } else if (bodyText.includes('Rate limit exceeded')) {
              message = bodyText.trim();
            }
            
            handleRateLimitDetected(message);
            return;
          }
        }
      } catch (error) {
        // Cross-origin restrictions prevent access, which is normal
        console.log('Cannot access iframe content (cross-origin), proceeding normally');
      }
      
      // Additional check: Monitor if iframe loaded but shows blank/error content
      setTimeout(async () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            const bodyText = iframeDoc.body?.textContent || '';
            const hasContent = bodyText.trim().length > 0;
            
            // If iframe loaded but has no content, it might be a rate limit response
            if (!hasContent) {
              console.log('🚫 Iframe loaded but has no content, checking for rate limiting');
              const rateLimitCheck = await checkForRateLimiting(url);
              if (rateLimitCheck.isRateLimited) {
                handleRateLimitDetected(rateLimitCheck.message || "Rate limit exceeded");
                return;
              }
            }
          }
        } catch (error) {
          // Cross-origin restrictions, ignore
        }
      }, 500); // Check after 500ms
      
      // Mark as loaded if no rate limiting detected
      markAsLoaded();
      
      // Start periodic monitoring for rate limiting after page loads
      rateLimitMonitorRef.current = setInterval(async () => {
        try {
          const rateLimitCheck = await checkForRateLimiting(url);
          if (rateLimitCheck.isRateLimited) {
            console.log('🚫 Rate limiting detected during periodic check');
            handleRateLimitDetected(rateLimitCheck.message || "Rate limit exceeded");
          }
        } catch (error) {
          console.log('Error during periodic rate limit check:', error);
        }
      }, 5000); // Check every 5 seconds
    };

    iframe.onerror = async () => {
      console.log('❌ Iframe error occurred, checking for rate limiting');
      
      // When iframe fails to load, check if it's due to rate limiting
      const rateLimitCheck = await checkForRateLimiting(url);
      if (rateLimitCheck.isRateLimited) {
        handleRateLimitDetected(rateLimitCheck.message || "Rate limit exceeded");
        return;
      }
    };

    // Check for rate limiting before loading
    checkForRateLimiting(url).then((rateLimitCheck) => {
      if (rateLimitCheck.isRateLimited) {
        handleRateLimitDetected(rateLimitCheck.message || "Rate limit exceeded");
        return;
      }
      
      // Load the page if not rate limited
      console.log('🌐 Setting iframe src to:', proxyUrl);
      iframe.src = proxyUrl;

      // Start countdown
      console.log('⏱️ Starting countdown from 2.0 seconds...');
      setCountdown(2.0);

      // Update countdown every 100ms
      console.log('🔄 Setting up countdown interval...');
      countdownIntervalRef.current = setInterval(() => {
        timeLeft -= 0.1;
        const newCountdown = Math.max(0, timeLeft);
        setCountdown(newCountdown);

        // Debug log every second
        if (timeLeft % 1 < 0.1) {
          console.log(`⏰ Countdown: ${newCountdown.toFixed(1)}s`);
        }

        if (timeLeft <= 0.1) {
          console.log('⏰ Countdown reached zero');
        }
      }, 100);

      // Force refresh after exactly 2 seconds
      console.log('⏰ Setting up 2-second timeout...');
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('🚨 TIMEOUT TRIGGERED! hasLoaded:', hasLoaded);
        if (!hasLoaded) {
          forceRefresh();
        } else {
          console.log('✅ Page already loaded, skipping refresh');
        }
      }, 2000);
    });

    console.log('🎯 loadIframe setup complete!');
  };

  // Popular educational sites
  const popularSites = [
    { name: "Wikipedia", url: "https://www.wikipedia.org", description: "Free encyclopedia" },
    { name: "GitHub Search", url: "https://github.com/search", description: "Search code repositories" },
    { name: "arXiv", url: "https://arxiv.org", description: "Scientific papers & research" },
    { name: "Google Scholar", url: "https://scholar.google.com", description: "Academic search engine" },
    { name: "MIT OpenCourseWare", url: "https://ocw.mit.edu", description: "Free MIT course materials" },
    { name: "NitroType", url: "https://www.nitrotype.com", description: "Typing speed racing game" },
  ];

  const validateUrl = (inputUrl: string): string => {
    let validUrl = inputUrl.trim();

    // Add protocol if missing
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = 'https://' + validUrl;
    }

    try {
      new URL(validUrl);
      return validUrl;
    } catch {
      throw new Error("Please enter a valid URL");
    }
  };

  const checkUrlSafety = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/url/check-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      return data.isSafe;
    } catch (error) {
      console.error('Error checking URL safety:', error);
      return true; // Default to safe if check fails
    }
  };

  const navigateToUrl = async (targetUrl: string) => {
    try {
      // Prevent rapid successive requests (anti-spam protection)
      const now = Date.now();
      if (now - lastRequestTimeRef.current < 1000) { // 1 second minimum between requests
        console.log('Request throttled - too frequent');
        return;
      }

      // Reset request count every minute
      if (now - lastRequestTimeRef.current > 60000) {
        requestCountRef.current = 0;
      }

      // Limit to 20 requests per minute
      if (requestCountRef.current >= 20) {
        setError("Too many requests. Please wait a moment before navigating again.");
        return;
      }

      requestCountRef.current++;
      lastRequestTimeRef.current = now;

      console.log('🚀 Starting navigation to:', targetUrl);
      setLoading(true);
      setError("");
      setProxyStatus("Checking URL safety...");

      const validUrl = validateUrl(targetUrl);

      // Check URL safety
      const isSafe = await checkUrlSafety(validUrl);
      if (!isSafe) {
        setError("This URL has been flagged as potentially unsafe. Please try a different site.");
        setProxyStatus("");
        setLoading(false);
        return;
      }

      setProxyStatus("Loading through secure proxy...");

      // Update history and current URL first so iframe gets rendered
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(validUrl);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      setCurrentUrl(validUrl);
      setUrl(validUrl);

      // Load the URL through the iframe helper (after iframe is rendered)
      console.log('📱 About to call loadIframe with:', validUrl);
      setTimeout(() => {
        loadIframe(validUrl);
      }, 100); // Small delay to ensure iframe is rendered
    } catch (err: any) {
      setError(err.message || "Failed to load the website");
      setProxyStatus("");
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      navigateToUrl(url);
    }
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const targetUrl = history[newIndex];
      setHistoryIndex(newIndex);
      setCurrentUrl(targetUrl);
      setUrl(targetUrl);
      setLoading(true);
      setProxyStatus("Loading through secure proxy...");

      setTimeout(() => {
        loadIframe(targetUrl);
      }, 100);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const targetUrl = history[newIndex];
      setHistoryIndex(newIndex);
      setCurrentUrl(targetUrl);
      setUrl(targetUrl);
      setLoading(true);
      setProxyStatus("Loading through secure proxy...");

      setTimeout(() => {
        loadIframe(targetUrl);
      }, 100);
    }
  };

  const refresh = () => {
    if (currentUrl) {
      setLoading(true);
      setProxyStatus("Refreshing through secure proxy...");

      setTimeout(() => {
        loadIframe(currentUrl);
      }, 100);
    }
  };

  const goHome = () => {
    setUrl("");
    setCurrentUrl("");
    setError("");
    setProxyStatus("");
    if (iframeRef.current) {
      iframeRef.current.src = "about:blank";
    }
  };

  return (
    <ClientSubscriptionCheck redirectTo="/pricing">
      <div className="container mx-auto px-4 py-8 pb-15 md:pb-8">
        <DynamicPageTitle title="UniShare | Proxy Browser" />

        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Proxy Browser</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary">
              <Shield className="h-3 w-3 mr-1" />
              Secure
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Browse the web securely and privately within UniShare
          </p>
        </header>

        {/* Browser Controls */}
        <Card className="mb-6">
          <CardHeader className="!p-4">
            {isMobile ? (
              <div className="flex flex-col gap-2 w-full">
                {/* Mobile: Navigation Buttons Row */}
                <div className="flex gap-2 w-full mb-2">
                  <Button variant="outline" onClick={goBack} disabled={historyIndex <= 0} className="flex-1 h-9 flex items-center justify-center proxy-nav-btn">
                    <ArrowLeft className="h-4 w-4 mx-auto md:h-6 md:w-6" />
                  </Button>
                  <Button variant="outline" onClick={goForward} disabled={historyIndex >= history.length - 1} className="flex-1 h-9 flex items-center justify-center proxy-nav-btn">
                    <ArrowRight className="h-4 w-4 mx-auto md:h-6 md:w-6" />
                  </Button>
                  <Button variant="outline" onClick={refresh} disabled={!currentUrl} className="flex-1 h-9 flex items-center justify-center proxy-nav-btn">
                    <RotateCcw className="h-4 w-4 mx-auto md:h-6 md:w-6" />
                  </Button>
                  <Button variant="outline" onClick={goHome} className="flex-1 h-9 flex items-center justify-center proxy-nav-btn">
                    <Home className="h-4 w-4 mx-auto md:h-6 md:w-6" />
                  </Button>
                </div>
                {/* Mobile: Search Bar Row (now also used for desktop) */}
                <div className="bg-background/80 backdrop-blur-md rounded-full px-3 py-1 shadow-sm border border-primary/10 hover:border-primary/20 transition-all duration-300 search-bar-container w-full">
                  <form onSubmit={handleSubmit} className="relative w-full flex items-center">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center z-10 search-icon-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary/80 search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="11" cy="11" r="7" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <Input
                      type="text"
                      placeholder="Enter a website URL (e.g., wikipedia.org)"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="pl-11 pr-4 w-full text-lg py-3 rounded-full bg-transparent border-none shadow-none transition-all duration-300 search-input-no-outline placeholder:text-muted-foreground/70 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus-visible:outline-none active:outline-none"
                      style={{ textOverflow: 'ellipsis' }}
                    />
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <Button variant="outline" onClick={goBack} disabled={historyIndex <= 0} className="proxy-nav-btn">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={goForward} disabled={historyIndex >= history.length - 1} className="proxy-nav-btn">
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={refresh} disabled={!currentUrl} className="proxy-nav-btn">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={goHome} className="proxy-nav-btn">
                  <Home className="h-4 w-4" />
                </Button>
                <div className="flex-1 bg-background/80 backdrop-blur-md rounded-full px-3 py-2 md:py-1 shadow-sm border border-primary/10 hover:border-primary/20 transition-all duration-300 search-bar-container">
                  <form onSubmit={handleSubmit} className="relative w-full flex items-center">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center z-10 search-icon-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary/80 search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="11" cy="11" r="7" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <Input
                      type="text"
                      placeholder="Enter a website URL (e.g., wikipedia.org)"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="pl-11 pr-4 w-full text-lg md:text-base py-3 md:py-1 rounded-full bg-transparent border-none shadow-none transition-all duration-300 search-input-no-outline placeholder:text-muted-foreground/70 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus-visible:outline-none active:outline-none"
                      style={{ textOverflow: 'ellipsis' }}
                    />
                  </form>
                </div>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Proxy Status */}
        {proxyStatus && (
          <Alert className="mb-6 !pl-4 pr-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 flex-shrink-0" />
              <AlertDescription className="mb-0">{proxyStatus}</AlertDescription>
            </div>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 !pl-4 pr-4" variant="destructive">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <AlertDescription className="mb-0">{error}</AlertDescription>
            </div>
          </Alert>
        )}

        {/* Popular Sites */}
        {!currentUrl && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Popular Educational Sites</CardTitle>
              <CardDescription>
                Quick access to popular educational and research websites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularSites.map((site) => (
                  <Button
                    key={site.url}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start text-left"
                    onClick={() => navigateToUrl(site.url)}
                  >
                    <div className="font-medium">{site.name}</div>
                    <div className="text-sm text-muted-foreground">{site.description}</div>
                  </Button>
                ))}
              </div>
              <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Enhanced proxy supports dynamic content, API calls, and real-time features
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Browser Frame - Only show when there's a URL */}
        {currentUrl && (
          <Card className="h-[600px] overflow-hidden">
            <CardContent className="p-0 h-full relative">
              <iframe
                ref={iframeRef}
                className="w-full h-full border-none"
                title="Proxy Browser"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg font-medium">Loading page...</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Auto-refresh in {countdown > 0 ? countdown.toFixed(1) : '0.0'} seconds
                    </p>
                    {countdown > 0 && (
                      <div className="w-32 bg-gray-200 rounded-full h-2 mx-auto mt-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-100"
                          style={{ width: `${(countdown / 2) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* This component will only show if the user doesn't have an active subscription */}
        <SubscriptionRequiredNotice />
      </div>
    </ClientSubscriptionCheck>
  );
}

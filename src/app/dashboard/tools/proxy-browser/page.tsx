"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, ArrowLeft, ArrowRight, RotateCcw, Home, Shield, AlertTriangle } from "lucide-react";
import DynamicPageTitle from "@/components/dynamic-page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientSubscriptionCheck } from "@/components/client-subscription-check";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
  const requestCountRef = useRef<number>(0);
  const lastRequestTimeRef = useRef<number>(0);

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
    };
  }, []);

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

      // Clear timeouts
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };

    const forceRefresh = () => {
      console.log(`⏰ 2 seconds elapsed - forcing refresh (attempt ${retryCount + 1})`);

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
    iframe.onload = () => {
      console.log('📄 Iframe onload event fired');
      // Mark as loaded immediately when iframe loads
      markAsLoaded();
    };

    iframe.onerror = () => {
      console.log('❌ Iframe error occurred');
    };

    // Load the page
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

    console.log('🎯 loadIframe setup complete!');
  };

  // Popular educational sites
  const popularSites = [
    { name: "Wikipedia", url: "https://www.wikipedia.org", description: "Free encyclopedia" },
    { name: "GitHub Search", url: "https://github.com/search", description: "Search code repositories" },
    { name: "arXiv", url: "https://arxiv.org", description: "Scientific papers & research" },
    { name: "Google Scholar", url: "https://scholar.google.com", description: "Academic search engine" },
    { name: "MIT OpenCourseWare", url: "https://ocw.mit.edu", description: "Free MIT course materials" },
    { name: "Stabfish.io", url: "https://stabfish.io", description: "Multiplayer online game" },
    { name: "NitroType", url: "https://www.nitrotype.com", description: "Typing speed racing game" },
  ];

  const validateUrl = (inputUrl: string): string => {
    let validUrl = inputUrl.trim();

    // Add protocol if missing
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
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
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
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
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goBack}
                disabled={historyIndex <= 0}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goForward}
                disabled={historyIndex >= history.length - 1}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={!currentUrl}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goHome}
              >
                <Home className="h-4 w-4" />
              </Button>

              <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
                <Input
                  type="url"
                  placeholder="Enter a website URL (e.g., wikipedia.org)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  {loading ? "Loading..." : "Go"}
                </Button>
              </form>
            </div>
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
          <Alert className="mb-6" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
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
      </div>
    </ClientSubscriptionCheck>
  );
}

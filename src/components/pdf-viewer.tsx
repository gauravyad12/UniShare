"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, ZoomIn, ZoomOut, Maximize, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { isAppilixOrDevelopment } from '@/utils/appilix-detection';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from './ui/dialog';

// Import PDF.js dynamically to avoid SSR issues
import dynamic from 'next/dynamic';

// Define the props for our PDF viewer
interface PDFViewerProps {
  fileUrl: string;
  title: string;
  onDownload?: () => void;
}

// Create a dynamic import for PDF.js
const PDFJSViewer = dynamic(() => import('./pdf-js-viewer'), {
  ssr: false,
});

export default function PDFViewer({ fileUrl, title, onDownload }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const { theme } = useTheme();

  // Fetch the PDF as a blob
  useEffect(() => {
    setLoading(true);
    setError(null);
    setPdfData(null);

    const fetchPDF = async () => {
      try {
        const response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        setPdfData(uint8Array);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
        setLoading(false);
      }
    };

    fetchPDF();
  }, [fileUrl]);

  // Handle download button click
  const handleDownload = () => {
    // Check if we're in Appilix or development environment
    if (isAppilixOrDevelopment()) {
      // Open the PDF directly in the same tab
      window.location.href = fileUrl;
      return;
    }

    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `${title || 'document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle zoom in/out
  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    // Allow smaller scale on mobile devices
    const minScale = window.innerWidth < 768 ? 0.1 : 0.5;
    setScale(prevScale => Math.max(prevScale - 0.2, minScale));
  };

  // Handle full screen button click
  const handleFullScreen = () => {
    // Open the dialog
    setIsFullScreenOpen(true);
  };

  // Prevent PDF viewer from changing body background color
  useEffect(() => {
    if (isFullScreenOpen) {
      // Store the original background color
      const originalBgColor = document.body.style.backgroundColor;

      // Add a class to the body to enforce the background color
      document.body.classList.add('pdf-viewer-open');

      // Function to reset background color
      const resetBodyBackground = () => {
        // Check if the background has been changed by the PDF viewer
        if (document.body.style.backgroundColor === 'rgb(54, 54, 54)') {
          // Reset to original or default background
          document.body.style.backgroundColor = originalBgColor || '';
        }
      };

      // Set up an interval to check and reset the background color
      const intervalId = setInterval(resetBodyBackground, 100);

      // Also add a mutation observer to detect style changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'style') {
            resetBodyBackground();
          }
        });
      });

      observer.observe(document.body, { attributes: true });

      return () => {
        // Clean up
        clearInterval(intervalId);
        observer.disconnect();

        // Remove the class when dialog closes
        document.body.classList.remove('pdf-viewer-open');

        // Ensure background is reset when dialog closes
        document.body.style.backgroundColor = originalBgColor || '';
      };
    }
  }, [isFullScreenOpen]);

  // Page navigation is now handled directly in the PDF.js viewer component

  return (
    <>
      <div className="flex flex-col w-full h-full">
        {/* Top Controls - Download and Zoom */}
        <div className="flex items-center justify-between p-2 bg-muted/50 border-b">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Download PDF"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="View Full Screen"
              onClick={handleFullScreen}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>

          {/* Page info - only on desktop */}
          <div className="hidden md:flex items-center text-xs">
            {loading ? (
              <span>Loading...</span>
            ) : (
              <span>
                Page {currentPage} of {totalPages || '?'}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Zoom Out"
              onClick={handleZoomOut}
              disabled={loading || scale <= (window.innerWidth < 768 ? 0.1 : 0.5)}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Zoom In"
              onClick={handleZoomIn}
              disabled={loading || scale >= 3.0}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Viewer Content */}
        <div className="relative flex-1 bg-background min-h-[400px] md:min-h-[600px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10 min-h-[400px] md:min-h-[600px]">
              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10 min-h-[400px] md:min-h-[600px]">
              <div className="flex flex-col items-center justify-center">
                <div className="text-destructive text-center text-base font-medium mb-4">{error}</div>
                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Instead
                </Button>
              </div>
            </div>
          )}

          {/* Render PDF using PDF.js */}
          {pdfData && !loading && !error && (
            <PDFJSViewer
              pdfData={pdfData}
              currentPage={currentPage}
              scale={scale}
              onPageChange={setCurrentPage}
              onTotalPagesChange={setTotalPages}
              isDarkMode={theme === 'dark'}
            />
          )}
        </div>
      </div>

      {/* Full Screen Dialog */}
      <Dialog open={isFullScreenOpen} onOpenChange={setIsFullScreenOpen}>
        <DialogContent
          className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 pdf-fullscreen-dialog"
          aria-describedby="pdf-viewer-dialog-description"
        >
          <div className="flex flex-col h-full">
            {/* Hidden description element for accessibility */}
            <div id="pdf-viewer-dialog-description" className="sr-only">
              Full screen PDF viewer for {title || 'document'}
            </div>
            <DialogHeader className="flex flex-row items-center justify-between p-2 bg-background border-b space-y-0 mb-0">
              <div className="flex items-center">
                <DialogTitle className="text-lg font-medium">{title || 'PDF Viewer'}</DialogTitle>
                <DialogDescription className="sr-only">
                  Full screen PDF viewer for {title || 'document'}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsFullScreenOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            <div className="flex-1 h-full overflow-hidden">
              <div
                className="pdf-iframe-container w-full h-full"
                style={{
                  isolation: 'isolate',
                  contain: 'content',
                  position: 'relative'
                }}
              >
                <iframe
                  src={fileUrl}
                  title={title || 'PDF Viewer'}
                  className="w-full h-full border-none"
                  style={{
                    height: 'calc(95vh - 50px)',
                    isolation: 'isolate', // Prevent iframe from affecting parent styles
                    position: 'relative',
                    zIndex: 1
                  }}
                  sandbox="allow-same-origin allow-scripts"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

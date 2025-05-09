"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Skeleton } from './ui/skeleton';

// Import PDF.js library
// We're using dynamic imports to avoid SSR issues
let pdfjsLib: any;

interface PDFJSViewerProps {
  pdfData: Uint8Array;
  currentPage: number;
  scale: number;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (total: number) => void;
  isDarkMode: boolean;
}

export default function PDFJSViewer({
  pdfData,
  currentPage,
  scale,
  onPageChange,
  onTotalPagesChange,
  isDarkMode
}: PDFJSViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [renderTask, setRenderTask] = useState<any>(null);

  // Load PDF.js library
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        // Import PDF.js dynamically
        const pdfjs = await import('pdfjs-dist');

        // Set worker source
        const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
        pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

        pdfjsLib = pdfjs;
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF.js:', err);
        setError('Failed to load PDF viewer library');
        setLoading(false);
      }
    };

    loadPdfJs();
  }, []);

  // Load PDF document
  useEffect(() => {
    if (!pdfjsLib || !pdfData) return;

    const loadDocument = async () => {
      try {
        // Cancel any existing render task
        if (renderTask) {
          renderTask.cancel();
        }

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;

        setPdfDocument(pdf);
        onTotalPagesChange(pdf.numPages);

        // If current page is out of bounds, reset to page 1
        if (currentPage > pdf.numPages) {
          onPageChange(1);
        }
      } catch (err) {
        console.error('Error loading PDF document:', err);
        setError('Failed to load PDF document');
      }
    };

    loadDocument();

    // Cleanup function
    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfjsLib, pdfData]);

  // Calculate the optimal scale for mobile devices
  const calculateOptimalScale = useCallback((page: any) => {
    if (!canvasRef.current || !page) return scale;

    // Get the container width (accounting for padding)
    // Use the parent element's width or fallback to window width
    const containerElement = canvasRef.current.parentElement;
    const containerWidth = containerElement ? containerElement.clientWidth : window.innerWidth - 32;

    // Get the page dimensions at scale 1.0
    const viewport = page.getViewport({ scale: 1.0 });
    const pageWidth = viewport.width;

    // Calculate the scale that makes the page fit the container width with some margin
    // Use a slightly smaller value (0.95) to ensure there's a small margin
    const optimalScale = (containerWidth * 0.95) / pageWidth;

    // For very small screens, ensure the scale is not too small
    const minScale = window.innerWidth < 400 ? 0.6 : 0.5;

    // Return the optimal scale, but not smaller than minScale and not larger than 2.0
    return Math.min(Math.max(optimalScale, minScale), 2.0);
  }, [scale]);

  // Add a resize listener to adjust the scale when the window size changes
  useEffect(() => {
    // Debounce function to avoid too many renders during resize
    let resizeTimer: NodeJS.Timeout;

    const handleResize = () => {
      // Clear any existing timer
      clearTimeout(resizeTimer);

      // Set a new timer to delay the execution
      resizeTimer = setTimeout(() => {
        // Only re-render if we have all the necessary objects
        if (pdfjsLib && pdfDocument && canvasRef.current) {
          // Force a re-render by triggering the render effect
          setRenderTask((prev: any) => {
            // Cancel any existing render task
            if (prev) {
              try {
                prev.cancel();
              } catch (e) {
                // Ignore errors during cancellation
              }
            }
            return null;
          });
        }
      }, 100); // 100ms debounce time for faster response
    };

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Initial render after component mounts
    handleResize();

    // Cleanup
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [pdfjsLib, pdfDocument]);

  // Track viewport width for responsive rendering
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  // Update viewport width on resize
  useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  // Render PDF page when currentPage, scale, or viewport width changes
  useEffect(() => {
    if (!pdfjsLib || !pdfDocument || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        // Cancel any existing render task
        if (renderTask) {
          renderTask.cancel();
        }

        // Get the page
        const page = await pdfDocument.getPage(currentPage);

        // Determine the optimal scale for mobile
        const isMobile = viewportWidth < 768; // Tailwind's md breakpoint
        const pageScale = isMobile ? calculateOptimalScale(page) : scale;

        // Set viewport
        const viewport = page.getViewport({ scale: pageScale });

        // Prepare canvas
        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error('Canvas element is null');
        }

        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Failed to get 2D context from canvas');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render the page with white background
        const task = page.render({
          canvasContext: context,
          viewport,
          background: 'rgba(255, 255, 255, 1)', // Always use white background for PDF content
        });

        setRenderTask(task);

        await task.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelled') {
          console.error('Error rendering PDF page:', err);
          setError('Failed to render PDF page');
        }
      }
    };

    renderPage();

    // Cleanup function
    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfjsLib, pdfDocument, currentPage, scale, isDarkMode, calculateOptimalScale, viewportWidth]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full min-h-[400px] md:min-h-[600px]">
        <div className="flex flex-col items-center justify-center">
          <Skeleton className="h-[300px] w-[300px] md:h-[400px] md:w-[400px] rounded-md" />
          <div className="mt-4 text-sm text-center text-muted-foreground">Loading PDF.js...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full min-h-[400px] md:min-h-[600px]">
        <div className="flex flex-col items-center justify-center">
          <div className="text-destructive text-center text-base font-medium">{error}</div>
        </div>
      </div>
    );
  }

  // Determine if we're in mobile view
  const isMobileView = viewportWidth < 768;

  return (
    <div className="flex flex-col w-full">
      <div
        className={`w-full overflow-auto ${isMobileView ? 'h-auto' : 'h-[600px]'}`}
        data-testid="pdf-container"
      >
        <div className="flex justify-center min-w-fit p-2">
          <canvas
            ref={canvasRef}
            className="shadow-md"
            data-viewport-width={viewportWidth}
          />
        </div>
      </div>

      {/* Bottom Navigation Bar - Styled exactly like the top bar */}
      {pdfDocument && (
        <div className="flex items-center justify-between p-2 bg-muted/50 border-t w-full">
          <div className="flex items-center space-x-1">
            {/* First Page Button */}
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage <= 1}
              className="h-8 w-8 p-0 rounded-sm flex items-center justify-center hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="First page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="11 17 6 12 11 7"></polyline>
                <polyline points="18 17 13 12 18 7"></polyline>
              </svg>
            </button>

            {/* Previous Page Button */}
            <button
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-8 w-8 p-0 rounded-sm flex items-center justify-center hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          </div>

          <div className="flex items-center text-xs">
            <span>
              {currentPage} / {pdfDocument.numPages}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {/* Next Page Button */}
            <button
              onClick={() => currentPage < pdfDocument.numPages && onPageChange(currentPage + 1)}
              disabled={currentPage >= pdfDocument.numPages}
              className="h-8 w-8 p-0 rounded-sm flex items-center justify-center hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            {/* Last Page Button */}
            <button
              onClick={() => onPageChange(pdfDocument.numPages)}
              disabled={currentPage >= pdfDocument.numPages}
              className="h-8 w-8 p-0 rounded-sm flex items-center justify-center hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Last page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 17 18 12 13 7"></polyline>
                <polyline points="6 17 11 12 6 7"></polyline>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

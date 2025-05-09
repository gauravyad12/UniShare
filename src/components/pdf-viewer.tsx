"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useTheme } from 'next-themes';

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
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <Skeleton className="h-[80%] w-[80%] rounded-md" />
      <div className="mt-4 text-sm text-muted-foreground">Loading PDF viewer...</div>
    </div>
  ),
});

export default function PDFViewer({ fileUrl, title, onDownload }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
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
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  // Page navigation is now handled directly in the PDF.js viewer component

  return (
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
            disabled={loading || scale <= 0.5}
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10 min-h-[400px] md:min-h-[600px]">
            <div className="flex flex-col items-center justify-center">
              <Skeleton className="h-[300px] w-[300px] md:h-[400px] md:w-[400px] rounded-md" />
              <div className="mt-4 text-sm text-center text-muted-foreground flex items-center justify-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading PDF...
              </div>
            </div>
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
        {pdfData && (
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
  );
}

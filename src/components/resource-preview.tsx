"use client";

import { useState, useEffect } from "react";
import { FileText, AlertCircle, ExternalLink, Loader2 } from "lucide-react";

interface ResourcePreviewProps {
  resourceId: string;
  resourceType: string;
  fileUrl?: string;
  externalLink?: string;
  title: string;
  thumbnailUrl?: string;
}

export default function ResourcePreview({
  resourceId,
  resourceType,
  fileUrl,
  externalLink,
  title,
  thumbnailUrl,
}: ResourcePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // Reset image loading state when preview URL changes
  useEffect(() => {
    if (previewUrl) {
      setImageLoading(true);
      // If we have a previewUrl but no thumbnailUrl, it means we just generated a new thumbnail
      // We should update the resource in the database
      if (!thumbnailUrl) {
        console.log("Generated new thumbnail, updating resource:", resourceId);
      }
    }
  }, [previewUrl, thumbnailUrl, resourceId]);

  useEffect(() => {
    let isMounted = true;
    const loadPreview = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(false);

      try {
        // If we already have a thumbnail URL, use it
        if (thumbnailUrl) {
          console.log("Using existing thumbnail URL:", thumbnailUrl);
          setPreviewUrl(thumbnailUrl);
          setLoading(false);
        } else if ((resourceType === "link" && externalLink) || (fileUrl && fileUrl.toLowerCase().endsWith(".pdf"))) {
          // Generate thumbnails for external links and PDF files
          console.log(`No thumbnail URL found for ${resourceType}, generating one`);
          // Mark that we've attempted to fetch a thumbnail
          setFetchAttempted(true);
          try {
            // Start the thumbnail generation process
            const generateThumbnail = async () => {
              try {
                const response = await fetch('/api/thumbnails/screenshot', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    resourceId,
                    resourceType,
                    externalLink,
                    fileUrl,
                  }),
                });

                if (!isMounted) return;

                if (response.ok) {
                  const data = await response.json();
                  console.log("Thumbnail generated successfully:", data.thumbnailUrl);
                  setPreviewUrl(data.thumbnailUrl);
                  // If this is a newly generated thumbnail, reload the page to update the UI
                  if (!thumbnailUrl && data.thumbnailUrl) {
                    window.location.reload();
                    return;
                  }
                  // Don't set loading to false here - we'll do that when the image loads
                } else {
                  console.error("Failed to generate thumbnail:", await response.text());
                  setPreviewUrl(null);
                  setLoading(false); // Set loading to false on error
                  setFetchAttempted(true); // Mark that we've attempted to fetch
                }
              } catch (e) {
                if (!isMounted) return;
                console.error('Error generating thumbnail:', e);
                setPreviewUrl(null);
                setLoading(false); // Set loading to false on error
                setFetchAttempted(true); // Mark that we've attempted to fetch
              }
            };

            // Don't await this - let it run in the background
            generateThumbnail();

            // Keep loading state active until the thumbnail is actually loaded
            // Don't set loading to false here - we'll do that when the image loads
            // or if there's an error
          } catch (e) {
            if (!isMounted) return;
            console.error('Error initiating thumbnail generation:', e);
            setPreviewUrl(null);
            setLoading(false);
          }
        } else {
          // For other resource types, just show a placeholder
          console.log("No thumbnail generation for non-link resources");
          setPreviewUrl(null);
          setLoading(false);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error loading preview:", err);
        setError(true);
        setLoading(false);
      }
    };

    loadPreview();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [resourceId, fileUrl, externalLink, thumbnailUrl, resourceType]);

  if (loading) {
    return (
      <div className="w-full h-56 bg-muted/30 rounded-md overflow-hidden flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 mb-2 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-56 bg-muted/30 rounded-md overflow-hidden flex flex-col items-center justify-center text-muted-foreground">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="text-xs">Preview unavailable</p>
      </div>
    );
  }

  // If we have a stored preview URL, use it
  if (previewUrl) {
    return (
      <div className="w-full h-56 bg-muted/30 rounded-md overflow-hidden relative group">
        {imageLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <Loader2 className="h-8 w-8 mb-2 animate-spin text-primary" />
          </div>
        )}
        <img
          src={previewUrl}
          alt={`Preview of ${title}`}
          className={`w-full h-full ${fileUrl && fileUrl.toLowerCase().endsWith(".pdf") ? "object-cover scale-100" : "object-cover"}`}
          loading="lazy"
          style={{
            objectPosition: fileUrl && fileUrl.toLowerCase().endsWith(".pdf") ? 'center 15%' : 'center top',
          }}
          onLoad={() => {
            setImageLoading(false);
            setLoading(false);
          }}
        />
      </div>
    );
  }

  // For external links without a preview, add a clickable option as a fallback
  // Only show this if we've already attempted to fetch and it failed
  if (resourceType === "link" && externalLink && !thumbnailUrl && !previewUrl && fetchAttempted && !loading) {
    // Extract domain for display
    let domain = '';
    try {
      domain = new URL(externalLink).hostname.replace('www.', '');
    } catch (e) {
      domain = externalLink;
    }

    return (
      <div
        className="w-full h-56 bg-muted/30 rounded-md overflow-hidden relative group cursor-pointer"
        onClick={(e) => {
          // Prevent the click from navigating to the resource view
          e.stopPropagation();
          e.preventDefault();
          // Try to fetch the screenshot again when clicked
          console.log('Attempting to generate link preview for:', { resourceId, externalLink });
          setLoading(true);

          fetch('/api/thumbnails/screenshot', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              resourceId,
              resourceType,
              externalLink,
            }),
          })
          .then(response => {
            console.log('Link preview API response status:', response.status);
            return response.json();
          })
          .then(data => {
            console.log('Link preview API response data:', data);
            if (data.success && data.thumbnailUrl) {
              console.log('Setting new preview URL:', data.thumbnailUrl);
              // Update both the preview URL and set it as the thumbnail URL
              setPreviewUrl(data.thumbnailUrl);
              // This will force a refresh of the component with the new thumbnail
              window.location.reload();
            } else {
              console.warn('API returned success=false or no thumbnailUrl');
              setLoading(false);
            }
          })
          .catch(error => {
            console.error('Error fetching link thumbnail:', error);
            setLoading(false);
          });
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-primary/70 group-hover:text-primary transition-colors">
          <ExternalLink className="h-10 w-10 mb-2" />
          <p className="text-xs font-medium">{domain}</p>
          <p className="text-xs text-muted-foreground mt-2">Click to generate preview</p>
        </div>
      </div>
    );
  }

  // For PDF files without a preview, add a clickable option as a fallback
  // Only show this if we've already attempted to fetch and it failed
  if (fileUrl && fileUrl.toLowerCase().endsWith(".pdf") && !thumbnailUrl && !previewUrl && fetchAttempted && !loading) {
    return (
      <div
        className="w-full h-56 bg-muted/30 rounded-md overflow-hidden relative group cursor-pointer"
        onClick={(e) => {
          // Prevent the click from navigating to the resource view
          e.stopPropagation();
          e.preventDefault();
          // Try to fetch the screenshot for the PDF
          console.log('Attempting to generate PDF preview for:', { resourceId, fileUrl });
          setLoading(true);

          fetch('/api/thumbnails/screenshot', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              resourceId,
              resourceType,
              fileUrl,
            }),
          })
          .then(response => {
            console.log('PDF preview API response status:', response.status);
            return response.json();
          })
          .then(data => {
            console.log('PDF preview API response data:', data);
            if (data.success && data.thumbnailUrl) {
              console.log('Setting new preview URL:', data.thumbnailUrl);
              // Update both the preview URL and set it as the thumbnail URL
              setPreviewUrl(data.thumbnailUrl);
              // This will force a refresh of the component with the new thumbnail
              window.location.reload();
            } else {
              console.warn('API returned success=false or no thumbnailUrl');
              setLoading(false);
            }
          })
          .catch(error => {
            console.error('Error fetching PDF thumbnail:', error);
            setLoading(false);
          });
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-primary/70 group-hover:text-primary transition-colors">
          <FileText className="h-10 w-10 mb-2" />
          <p className="text-xs font-medium">PDF Document</p>
          <p className="text-xs text-muted-foreground mt-2">Click to generate preview</p>
        </div>
      </div>
    );
  }

  // Default placeholder for all other resource types
  return (
    <div className="w-full h-56 bg-muted/30 rounded-md overflow-hidden relative group">
      <div className="absolute inset-0 flex flex-col items-center justify-center text-primary/70 group-hover:text-primary transition-colors">
        {resourceType === "link" ? (
          <ExternalLink className="h-10 w-10 mb-2" />
        ) : fileUrl && fileUrl.toLowerCase().endsWith(".pdf") ? (
          <FileText className="h-10 w-10 mb-2" />
        ) : (
          <FileText className="h-10 w-10 mb-2" />
        )}
        <p className="text-xs font-medium">
          {resourceType === "link" ? "External Link" :
           fileUrl && fileUrl.toLowerCase().endsWith(".pdf") ? "PDF Document" :
           resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}
        </p>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { showDownloadToast } from "@/components/mobile-aware-download-toast";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Download,
  ThumbsUp,
  Edit,
  Trash,
  ExternalLink,
  MessageSquare,
  Send,
  RefreshCw,
  Eye,
  CheckCircle,
  Share2,
  UserCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import ResourceEditForm from "./resource-edit-form";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  course_code?: string;
  professor?: string;
  file_url?: string;
  external_link?: string;
  author_id: string;
  created_at: string;
  view_count: number;
  download_count: number;
  downloads?: number; // Added for backward compatibility
  likes?: number;
  comment_count?: number;
  created_by?: string;
  creator_username?: string;
  creator_full_name?: string;
  creator_avatar_url?: string;
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  resource_id: string;
  user_profiles: {
    id?: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

// Format numbers to use k, m, etc. for thousands, millions, etc.
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "m";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return num.toString();
};

export default function ResourceView({
  resource,
  isOwner = false,
  currentUserId,
}: {
  resource: Resource;
  isOwner?: boolean;
  currentUserId?: string;
}) {
  // We're not using toast anymore
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(resource.likes || 0);
  const [showPdfViewer, setShowPdfViewer] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState<number>(
    resource.comment_count || 0,
  );
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isRefreshingComments, setIsRefreshingComments] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState<{ id?: string; username?: string; fullName?: string } | null>(null);



  // Function to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);

    // Use our mobile-aware toast system
    showDownloadToast({
      title: "Link copied to clipboard",
      status: "success"
    });
  };

  // Function to share resource
  const shareResource = async () => {
    // Use the public-facing URL format for sharing
    const shareUrl = `${window.location.origin}/resource/${resource.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: resource.title,
          text: resource.description,
          url: shareUrl,
        });
      } catch (error: any) {
        // Handle AbortError (user cancelled) and NotAllowedError (permission denied)
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
          // Fall back to clipboard copy only for non-abort errors
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  // Fetch comments and update the count
  const fetchComments = async () => {
    try {
      setIsRefreshingComments(true);
      const timestamp = new Date().getTime(); // Add timestamp to prevent caching
      const response = await fetch(
        `/api/resources/${resource.id}/comments?t=${timestamp}`,
        {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.comments) {
          setComments(data.comments);
          // Always use the server's count
          setCommentCount(data.count);
        } else {
          console.error("No comments in response:", data);
          setComments([]);
          setCommentCount(0);
        }
      } else {
        console.error("Error fetching comments:", await response.text());
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setIsRefreshingComments(false);
    }
  };

  // Submit a new comment
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      const response = await fetch(`/api/resources/${resource.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: newComment }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewComment("");
        // Don't manually update comments - rely on the realtime subscription
        // to avoid duplicate comments

        // Update comment count from server response
        setCommentCount(data.count);

        // Scroll to the comments section after adding a new comment
        setTimeout(() => {
          if (commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 300); // Small delay to ensure the comment is rendered
      } else {
        setCommentError(data.error || "Failed to post comment");
      }
    } catch (err: any) {
      setCommentError(err.message || "An error occurred");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Delete a comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/resources/${resource.id}/comments?commentId=${commentId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Remove the deleted comment from the list
        setComments((prevComments) =>
          prevComments.filter((comment) => comment.id !== commentId),
        );

        // Update comment count from server response
        setCommentCount(data.count);
      } else {
        const data = await response.json();
        console.error("Error deleting comment:", data.error);
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  // Format date for comments
  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // We're now using the mobile-aware-download-toast component instead of these functions

  // Fetch creator info if not already provided
  useEffect(() => {
    const fetchCreatorInfo = async () => {
      // If we already have creator info from props, use that
      if (resource.creator_username || resource.creator_full_name) {
        setCreatorInfo({
          id: resource.author_id || resource.created_by,
          username: resource.creator_username,
          fullName: resource.creator_full_name,
        });
        return;
      }

      // Otherwise fetch it from the database
      const authorId = resource.author_id || resource.created_by;
      if (!authorId) return;

      try {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();
        const { data } = await supabase
          .from("user_profiles")
          .select("id, username, full_name")
          .eq("id", authorId)
          .single();

        if (data) {
          setCreatorInfo({
            id: data.id,
            username: data.username,
            fullName: data.full_name,
          });
        }
      } catch (err) {
        console.error("Error fetching creator info:", err);
      }
    };

    fetchCreatorInfo();
  }, [resource]);

  // Initialize comments and setup
  useEffect(() => {
    // Scroll to the top of the page when the component mounts
    window.scrollTo(0, 0);

    // Fetch comments when the component mounts
    fetchComments();

    // Store the original body styles
    const originalBodyStyle = document.body.style.cssText;
    const originalBodyClassName = document.body.className;

    // Add a global style to use theme background on PDF viewers
    const styleElement = document.createElement("style");
    styleElement.id = "pdf-viewer-styles";
    styleElement.textContent = `
      .bg-background {
        background-color: hsl(var(--background)) !important;
      }
      iframe[title*="PDF viewer"] {
        background-color: hsl(var(--background)) !important;
      }
      iframe[title*="PDF viewer"]::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: hsl(var(--background)) !important;
        z-index: 0;
      }
    `;

    // Check if the style element already exists before appending
    if (!document.getElementById("pdf-viewer-styles")) {
      document.head.appendChild(styleElement);
    }

    // Listen for the custom event to close the edit dialog
    const handleEditComplete = () => setShowEditDialog(false);
    document.addEventListener("resource-edit-complete", handleEditComplete);

    // Check if the user has already liked this resource
    const checkLikeStatus = async () => {
      try {
        setIsLoading(true);
        const timestamp = new Date().getTime(); // Add timestamp to prevent caching
        const response = await fetch(
          `/api/resources/${resource.id}/like?t=${timestamp}`,
          {
            method: "GET",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setHasLiked(data.hasLiked);
          setLikeCount(data.likeCount);
        }
      } catch (err) {
        console.error("Error checking like status:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkLikeStatus();

    // Set up a realtime subscription for like count updates
    const setupRealtimeSubscription = async () => {
      try {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();

        // Subscribe to changes on the resource_likes table for this resource
        const subscription = supabase
          .channel("resource-likes-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "resource_likes",
              filter: `resource_id=eq.${resource.id}`,
            },
            () => {
              // When a change occurs, refresh the like count
              checkLikeStatus();
            },
          )
          .subscribe();

        return () => {
          supabase.removeChannel(subscription);
        };
      } catch (err) {
        console.error("Error setting up realtime subscription:", err);
        return () => {};
      }
    };

    // Store the cleanup function
    let cleanupFunction: (() => void) | null = null;

    // Set up the subscription and store the cleanup function
    setupRealtimeSubscription().then(cleanup => {
      cleanupFunction = cleanup;
    });

    return () => {
      // Restore the original body styles when component unmounts
      document.body.style.cssText = originalBodyStyle;
      document.body.className = originalBodyClassName;

      // Force a reset of any background-color that might have been applied
      document.body.style.removeProperty("background-color");

      // Remove the added style element
      const styleToRemove = document.getElementById("pdf-viewer-styles");
      if (styleToRemove && document.head.contains(styleToRemove)) {
        document.head.removeChild(styleToRemove);
      }

      // Remove any other PDF viewer styles that might have been added
      const allStyles = document.head.getElementsByTagName("style");
      for (let i = allStyles.length - 1; i >= 0; i--) {
        const style = allStyles[i];
        if (style.textContent && style.textContent.includes("PDF viewer")) {
          document.head.removeChild(style);
        }
      }

      document.removeEventListener(
        "resource-edit-complete",
        handleEditComplete,
      );

      // Clean up the subscription when component unmounts
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [resource.id]);

  // Set up a realtime subscription for comments
  useEffect(() => {
    const setupCommentsSubscription = async () => {
      try {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();

        // Subscribe to changes on the resource_comments table for this resource
        const subscription = supabase
          .channel("resource-comments-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "resource_comments",
              filter: `resource_id=eq.${resource.id}`,
            },
            () => {
              // When a change occurs, refresh the comments
              fetchComments();
            },
          )
          .subscribe();

        // Also subscribe to changes on the resources table for this resource
        // to catch comment_count updates
        const resourceSubscription = supabase
          .channel("resource-updates")
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "resources",
              filter: `id=eq.${resource.id}`,
            },
            (payload: any) => {
              // When the resource is updated, check if comment_count changed
              if (
                payload.new &&
                typeof payload.new.comment_count === "number"
              ) {
                setCommentCount(payload.new.comment_count);
              }
            },
          )
          .subscribe();

        return () => {
          supabase.removeChannel(subscription);
          supabase.removeChannel(resourceSubscription);
        };
      } catch (err) {
        console.error("Error setting up comments subscription:", err);
        return () => {};
      }
    };

    // Store the cleanup function
    let commentsCleanupFunction: (() => void) | null = null;

    // Set up the subscription and store the cleanup function
    setupCommentsSubscription().then(cleanup => {
      commentsCleanupFunction = cleanup;
    });

    return () => {
      // Clean up the subscription when component unmounts
      if (commentsCleanupFunction) {
        commentsCleanupFunction();
      }
    };
  }, [resource.id]);

  // We'll only scroll to comments when a user explicitly adds a new comment
  // No automatic scrolling on page load or when comments are fetched

  const handleDownload = async () => {

    // Determine if we're handling an external link or a file
    const isExternalLink = !!resource.external_link;
    const isFileResource = !!resource.file_url;

    if (!isExternalLink && !isFileResource) {
      // Show error message for non-downloadable content
      showDownloadToast({
        title: resource.title,
        status: "error",
        fallbackMessage: "No downloadable content available"
      });
      return;
    }

    // Handle external link
    if (isExternalLink && resource.external_link) {
      try {
        // Use a safer way to open links
        const newWindow = window.open();
        if (newWindow) {
          newWindow.opener = null; // For security
          newWindow.location.href = resource.external_link;
          newWindow.focus();
        } else {
          // Fallback if popup is blocked
          window.location.href = resource.external_link;
        }
        router.refresh();
        return;
      } catch (linkError) {
        console.error("Error opening external link:", linkError);

        // Show error message for link opening failure
        showDownloadToast({
          title: resource.title,
          status: "error",
          fallbackMessage: "Failed to open external link. It may be blocked by your browser."
        });
        return;
      }
    }

    // Handle file download
    if (isFileResource && resource.file_url) {
      // Set downloading state
      setIsDownloading(true);
      setError(null);

      // Show downloading toast/overlay
      showDownloadToast({
        title: resource.title,
        status: "downloading"
      });

      // Use the Blob API to download the file directly
      fetch(`/api/resources/${resource.id}/download`, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      })
        .then((response) => {
          if (!response.ok) throw new Error("Download failed");
          return response.blob();
        })
        .then((blob) => {
          // Create a blob URL and trigger download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = `${resource.title || "download"}.pdf`;
          document.body.appendChild(a);
          a.click();

          // Clean up immediately
          window.URL.revokeObjectURL(url);
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }

          // Show success state
          setDownloadSuccess(true);
          setIsDownloading(false);

          // Show success toast/overlay
          showDownloadToast({
            title: resource.title,
            status: "success"
          });

          // Reset success state after 3 seconds
          setTimeout(() => {
            setDownloadSuccess(false);
          }, 3000);
        })
        .catch((error) => {
          console.error("Download error:", error);
          setIsDownloading(false);

          // Show error toast/overlay
          showDownloadToast({
            title: resource.title,
            status: "error",
            fallbackMessage: "There was a problem downloading the file. Trying alternative method..."
          });

          // Fallback to the API endpoint as a last resort
          try {
            const link = document.createElement("a");
            link.href = `/api/resources/${resource.id}/download`;
            link.download = `${resource.title || "download"}.pdf`;
            document.body.appendChild(link);
            link.click();

            // Clean up
            setTimeout(() => {
              if (document.body.contains(link)) {
                document.body.removeChild(link);
              }

              // Show success toast/overlay for fallback method
              showDownloadToast({
                title: resource.title,
                status: "success"
              });
            }, 1000);
          } catch (fallbackError) {
            console.error("Fallback download error:", fallbackError);
            window.open(`/api/resources/${resource.id}/download`, "_blank");
          }
        });
    }
  };

  const handleViewPdf = () => {
    setShowPdfViewer(!showPdfViewer);
  };

  const handleLike = async () => {
    if (hasLiked) return; // Prevent multiple likes

    // Start animation immediately when user clicks
    setIsLikeAnimating(true);
    setIsLoading(true);
    setError(null);

    try {
      // Delay the API call slightly to allow animation to be visible
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await fetch(`/api/resources/${resource.id}/like`, {
        method: "POST",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to like resource");
      }

      // Update local state
      setHasLiked(true);
      setLikeCount(data.likeCount);

      // Keep animation going for a bit longer after success
      setTimeout(() => {
        setIsLikeAnimating(false);
      }, 800); // Match animation duration
    } catch (err: any) {
      setError(err.message || "An error occurred while liking the resource");
      setIsLikeAnimating(false); // Reset animation on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/resources/${resource.id}/delete`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete resource");
      }

      setShowDeleteDialog(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting the resource");
    } finally {
      setIsLoading(false);
    }
  };

  // Format date
  const formattedDate = new Date(resource.created_at).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );

  // Get resource type color
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "notes":
        return "bg-blue-100 text-blue-800";
      case "textbook":
        return "bg-purple-100 text-purple-800";
      case "solution":
        return "bg-green-100 text-green-800";
      case "study guide":
        return "bg-yellow-100 text-yellow-800";
      case "practice exam":
        return "bg-red-100 text-red-800";
      case "link":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <Badge className={getTypeColor(resource.resource_type)}>
                {resource.resource_type}
              </Badge>
              {resource.course_code && (
                <Badge variant="outline" className="ml-2">
                  {resource.course_code}
                </Badge>
              )}
            </div>
            {isOwner && (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <CardTitle className="text-2xl mt-2">{resource.title}</CardTitle>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground">
            <div>Uploaded on {formattedDate}</div>
            {creatorInfo && (creatorInfo.username || creatorInfo.fullName) && (
              <div className="flex items-center">
                <span className="hidden sm:inline">•</span>
                <UserCircle className="h-3 w-3 mx-1" />
                <span
                  className="hover:underline cursor-pointer"
                  onClick={() => {
                    if (creatorInfo.username) {
                      window.open(`/u/${creatorInfo.username}`, '_blank');
                    }
                  }}
                >
                  {creatorInfo.fullName || creatorInfo.username || "Unknown User"}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-white/60 font-medium">{resource.description}</p>

            {resource.professor && (
              <div>
                <span className="font-medium">Professor:</span>{" "}
                {resource.professor}
              </div>
            )}

            {resource.external_link && (
              <div className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                <a
                  href={resource.external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {resource.external_link}
                </a>
              </div>
            )}

            {error && (
              <div className="bg-red-100 text-red-800 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>

          {/* PDF Viewer */}
          {showPdfViewer &&
            resource.file_url &&
            resource.file_url.toLowerCase().endsWith(".pdf") && (
              <div
                className="mt-4 border rounded-md overflow-hidden bg-background"
                style={{ height: "600px", position: "relative" }}
              >
                <iframe
                  src={`${resource.file_url}#toolbar=0&navpanes=0`}
                  width="100%"
                  height="100%"
                  style={{
                    border: "none",
                    position: "relative",
                    zIndex: 1,
                    backgroundColor: "hsl(var(--background))",
                  }}
                  title={`PDF viewer for ${resource.title}`}
                  onLoad={(e) => {
                    // Force theme background on the iframe and its contents
                    const iframe = e.currentTarget;
                    try {
                      // Try to access the iframe content document if same-origin
                      if (iframe.contentDocument) {
                        const iframeDoc = iframe.contentDocument;
                        const existingStyle =
                          iframeDoc.getElementById("pdf-iframe-styles");
                        if (existingStyle) {
                          iframeDoc.head.removeChild(existingStyle);
                        }

                        const style = iframeDoc.createElement("style");
                        style.id = "pdf-iframe-styles";
                        style.textContent = `
                          body, .pdfViewer, .page, .canvasWrapper, canvas {
                            background-color: hsl(var(--background)) !important;
                          }
                        `;
                        iframeDoc.head.appendChild(style);
                      }
                    } catch (err) {
                      console.log(
                        "Cannot access iframe content - cross-origin restriction",
                      );
                    }
                  }}
                />
              </div>
            )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between border-t pt-4 gap-4">
          <div className="flex items-center text-sm text-gray-500">
            {/* Only show download count for non-external link resources */}
            {!resource.external_link && (
              <div className="flex items-center mr-3">
                <Download className="h-4 w-4 mr-1" />
                <span>
                  {formatNumber(
                    resource.downloads || resource.download_count || 0,
                  )}
                </span>
              </div>
            )}
            <div className="flex items-center mr-3">
              <ThumbsUp className="h-4 w-4 mr-1" />
              <span>{formatNumber(likeCount)}</span>
            </div>
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              <span>{formatNumber(commentCount)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 flex-1 sm:flex-auto"
              onClick={shareResource}
            >
              <Share2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden xs:inline ml-1 sm:ml-0">Share</span>
            </Button>
            <Button
              variant={hasLiked ? "default" : "outline"}
              onClick={handleLike}
              disabled={isLoading || hasLiked}
              className={`
                ${hasLiked ? "bg-primary hover:bg-primary/90" : ""}
                ${isLikeAnimating ? "like-button-animation" : ""}
                flex-shrink-0 flex-1 sm:flex-auto relative overflow-hidden
                transition-all duration-200
              `}
              size="sm"
            >
              <ThumbsUp
                className={`
                  h-4 w-4 sm:mr-1
                  ${hasLiked ? "fill-white" : ""}
                  ${isLikeAnimating ? "like-icon-animation" : ""}
                  transition-transform duration-200
                `}
              />
              <span className="hidden xs:inline ml-1 sm:ml-0">{hasLiked ? "Liked" : "Like"}</span>
              {isLikeAnimating && (
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="absolute w-8 h-8 bg-primary/20 animate-ping rounded-full"></span>
                </span>
              )}
            </Button>
            {resource.file_url &&
              resource.file_url.toLowerCase().endsWith(".pdf") && (
                <Button
                  variant="outline"
                  onClick={handleViewPdf}
                  size="sm"
                  className="flex-shrink-0 flex-1 sm:flex-auto"
                >
                  <Eye className="h-4 w-4 sm:mr-1" />
                  <span className="hidden xs:inline ml-1 sm:ml-0">{showPdfViewer ? "Hide" : "View PDF"}</span>
                </Button>
              )}
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              size="sm"
              className="flex-shrink-0 flex-1 sm:flex-auto"
            >
              {isDownloading ? (
                <span className="flex items-center justify-center w-full">
                  <Download className="animate-bounce h-4 w-4 sm:mr-2" />
                  <span className="hidden xs:inline ml-1 sm:ml-0">Downloading...</span>
                </span>
              ) : downloadSuccess ? (
                <span className="flex items-center justify-center w-full">
                  <CheckCircle className="text-green-500 h-4 w-4 sm:mr-2" />
                  <span className="hidden xs:inline ml-1 sm:ml-0">Downloaded</span>
                </span>
              ) : resource.external_link ? (
                <span className="flex items-center justify-center w-full">
                  <ExternalLink className="h-4 w-4 sm:mr-2" />
                  <span className="hidden xs:inline ml-1 sm:ml-0">Visit Link</span>
                </span>
              ) : (
                <span className="flex items-center justify-center w-full">
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden xs:inline ml-1 sm:ml-0">Download</span>
                </span>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Comments Section */}
      <Card className="w-full mt-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Comments ({commentCount})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchComments}
              disabled={isRefreshingComments}
              className="h-8 w-8 p-0"
              title="Refresh comments"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshingComments ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Comment Input */}
          <div className="mb-6">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className={`resize-none mb-2 ${commentError ? "border-red-500" : ""}`}
              rows={3}
            />
            {commentError && (
              <p className="text-xs text-red-500 mb-2">
                {commentError}
              </p>
            )}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={isSubmittingComment || !newComment.trim()}
                size="sm"
              >
                {isSubmittingComment ? "Posting..." : "Post Comment"}
                <Send className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Comments List */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={comment.user_profiles?.avatar_url || undefined}
                    />
                    <AvatarFallback className="text-[10px]">
                      {(
                        comment.user_profiles?.full_name ||
                        comment.user_profiles?.username ||
                        "User"
                      )
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {comment.user_profiles?.full_name ||
                            comment.user_profiles?.username ||
                            "User"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCommentDate(comment.created_at)}
                        </p>
                      </div>
                      {comment.user_id === currentUserId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="mt-1 text-sm">{comment.comment}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
          </DialogHeader>
          <ResourceEditForm resource={resource} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete this resource? This action cannot
              be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="hover:bg-red-600 dark:hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

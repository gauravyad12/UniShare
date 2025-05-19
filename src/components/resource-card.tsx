import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Download,
  MessageSquare,
  Star,
  ThumbsUp,
  ExternalLink,
  CheckCircle,
  Share2,
  UserCircle,
  Eye,
  GraduationCap,
} from "lucide-react";
import ResourcePreview from "./resource-preview";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { showDownloadToast } from "@/components/mobile-aware-download-toast";
import { createClient } from "@/utils/supabase/client";

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    description: string;
    resource_type: string;
    course_code?: string;
    professor?: string;
    view_count: number;
    download_count: number;
    created_at: string;
    tags?: { tag_name: string }[];
    ratings?: { rating: number }[];
    comment_count?: number;
    likes?: number;
    downloads?: number;
    file_url?: string;
    external_link?: string;
    thumbnail_url?: string;
    author_id?: string;
    created_by?: string;
    creator_username?: string;
    creator_full_name?: string;
    creator_avatar_url?: string;
  };
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
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

export default function ResourceCard({
  resource,
  onView,
  onDownload,
}: ResourceCardProps) {
  // We're not using toast anymore
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState<{ username?: string; fullName?: string } | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const cardFooterRef = React.useRef<HTMLDivElement>(null);

  // Function to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
          // Fall back to clipboard copy only for non-abort errors
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setIsAuthenticated(!!data.user);
    };

    checkAuth();
  }, []);

  // Fetch creator info if not already provided
  useEffect(() => {
    const fetchCreatorInfo = async () => {
      // If we already have creator info from props, use that
      if (resource.creator_username || resource.creator_full_name) {
        setCreatorInfo({
          username: resource.creator_username,
          fullName: resource.creator_full_name,
        });
        return;
      }

      // Otherwise fetch it from the database
      const authorId = resource.author_id || resource.created_by;
      if (!authorId) return;

      const supabase = createClient();
      const { data } = await supabase
        .from("user_profiles")
        .select("username, full_name")
        .eq("id", authorId)
        .single();

      if (data) {
        setCreatorInfo({
          username: data.username,
          fullName: data.full_name,
        });
      }
    };

    fetchCreatorInfo();
  }, [resource]);

  // Set initial compact state based on screen size
  useEffect(() => {
    // For mobile devices, start with compact mode by default
    if (typeof window !== 'undefined') {
      // Check if we're on a mobile device (screen width < 640px)
      const isMobile = window.innerWidth < 640;
      setIsCompact(isMobile);
    }
  }, []);

  // Add resize observer to check available space for buttons
  useEffect(() => {
    if (!cardFooterRef.current) return;

    const checkSpace = () => {
      if (!cardFooterRef.current) return;

      const footerWidth = cardFooterRef.current.offsetWidth;
      const countersElement = cardFooterRef.current.querySelector('.counters-container');
      const buttonsContainer = cardFooterRef.current.querySelector('.buttons-container');

      if (!countersElement || !buttonsContainer) return;

      const countersWidth = countersElement.getBoundingClientRect().width;
      // Add margin to ensure we have enough space, but not too much
      const availableWidth = footerWidth - countersWidth - 48; // 48px for padding and margins

      // Calculate minimum width needed for buttons with text
      // Approx 95px per button with text plus a small buffer
      const minWidthNeeded = 295; // 95px * 3 buttons + 10px buffer

      const shouldBeCompact = availableWidth < minWidthNeeded;
      setIsCompact(shouldBeCompact);
    };

    // Initial check immediately
    checkSpace();

    // Create resize observer
    const resizeObserver = new ResizeObserver(checkSpace);

    resizeObserver.observe(cardFooterRef.current);

    // Also observe the parent card for size changes
    const parentCard = cardFooterRef.current.closest('.card');
    if (parentCard) {
      resizeObserver.observe(parentCard);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [resource.id]);

  // Calculate average rating if available
  const averageRating =
    resource.ratings && resource.ratings.length > 0
      ? resource.ratings.reduce((sum, item) => sum + item.rating, 0) /
        resource.ratings.length
      : 0;

  // Get likes count - ensure it's a number
  const likesCount = typeof resource.likes === "number" ? resource.likes : 0;

  // Format date - will be used in future UI updates
  // const formattedDate = new Date(resource.created_at).toLocaleDateString(
  //   "en-US",
  //   {
  //     year: "numeric",
  //     month: "short",
  //     day: "numeric",
  //   },
  // );

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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onView) {
      onView(resource.id);
    } else {
      const isPublicProfile =
        window.location.pathname.includes("/u/") ||
        window.location.pathname.includes("/public-profile/");

      if (isPublicProfile && !isAuthenticated) {
        router.push(
          `/sign-in?redirect=/dashboard/resources?view=${resource.id}`,
        );
      } else {
        // Use the dashboard URL for viewing (not the public-facing URL)
        router.push(`/dashboard/resources?view=${resource.id}`);
      }
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // We're now using the mobile-aware-download-toast component instead of these functions

  // No cleanup needed anymore

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onDownload) {
      onDownload(resource.id);
    } else {
      const isPublicProfile =
        window.location.pathname.includes("/u/") ||
        window.location.pathname.includes("/public-profile/");

      if (isPublicProfile && !isAuthenticated) {
        router.push(
          `/sign-in?redirect=/dashboard/resources?view=${resource.id}`,
        );
      } else {
        if (resource.resource_type === "link") {
          // Use the dashboard URL for viewing (not the public-facing URL)
          router.push(`/dashboard/resources?view=${resource.id}`);
        } else {
          // Set downloading state
          setIsDownloading(true);

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
      }
    }
  };

  return (
    <Card className="card overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <CardHeader className="pb-2">
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
          <div className="flex items-center gap-2">
            {averageRating > 0 && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm ml-1">{averageRating.toFixed(1)}</span>
              </div>
            )}
            <div className="flex items-center">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-sm ml-1">{likesCount}</span>
            </div>
          </div>
        </div>
        <CardTitle
          className="mt-2 text-xl cursor-pointer hover:underline"
          onClick={handleViewClick}
        >
          {resource.title}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          {creatorInfo && (creatorInfo.username || creatorInfo.fullName) && (
            <CardDescription className="text-sm flex items-center">
              <UserCircle className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{creatorInfo.fullName || creatorInfo.username || "Unknown User"}</span>
            </CardDescription>
          )}
          {resource.professor && (
            <CardDescription className="text-sm flex items-center">
              <GraduationCap className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">Prof. {resource.professor}</span>
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {/* Resource Preview */}
        <div className="mb-3 cursor-pointer" onClick={handleViewClick}>
          <ResourcePreview
            resourceId={resource.id}
            resourceType={resource.resource_type}
            fileUrl={resource.file_url}
            externalLink={resource.external_link}
            title={resource.title}
            thumbnailUrl={resource.thumbnail_url}
          />
        </div>

        <div className="flex flex-col h-full">
          <p className="text-foreground/70 font-medium line-clamp-2 mt-3">{resource.description}</p>

          <div className="flex flex-wrap gap-1 mt-3">
            {resource.tags?.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag.tag_name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter
        ref={cardFooterRef}
        className="flex justify-between py-3 border-t px-2 md:px-6 mt-auto h-[60px]"
      >
        <div className="counters-container flex items-center text-sm text-gray-500 mr-4">
          {/* Only show download count for non-link resources */}
          {resource.resource_type !== "link" && (
            <div className="flex items-center mr-3">
              <Download className="h-4 w-4 mr-1" />
              <span>
                {formatNumber(resource.downloads || resource.download_count || 0)}
              </span>
            </div>
          )}
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>{formatNumber(resource.comment_count || 0)}</span>
          </div>
        </div>

        <div className={`buttons-container flex ${isCompact ? 'gap-2' : 'gap-1 md:gap-2'} ml-auto`}>
          {/* Share Button */}
          <Button
            variant="outline"
            size="sm"
            className={`flex items-center justify-center ${isCompact ? 'w-10 min-w-10' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              shareResource();
            }}
          >
            <Share2 className="h-4 w-4" style={{ marginRight: isCompact ? 0 : '0.5rem' }} />
            {isCompact ? null : <span>Share</span>}
          </Button>

          {/* View Button */}
          <Button
            variant="outline"
            size="sm"
            className={`flex items-center justify-center ${isCompact ? 'w-10 min-w-10' : ''}`}
            onClick={handleViewClick}
          >
            <Eye className="h-4 w-4" style={{ marginRight: isCompact ? 0 : '0.5rem' }} />
            {isCompact ? null : <span>View</span>}
          </Button>

          {/* Download/Link Button */}
          <Button
            size="sm"
            className={`flex items-center justify-center ${isCompact ? 'w-10 min-w-10' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDownloadClick(e);
            }}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Download className="animate-bounce h-4 w-4" style={{ marginRight: isCompact ? 0 : '0.5rem' }} />
                {isCompact ? null : <span>Downloading...</span>}
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle className="text-green-500 h-4 w-4" style={{ marginRight: isCompact ? 0 : '0.5rem' }} />
                {isCompact ? null : <span>Downloaded</span>}
              </>
            ) : resource.resource_type === "link" ? (
              <>
                <ExternalLink className="h-4 w-4" style={{ marginRight: isCompact ? 0 : '0.5rem' }} />
                {isCompact ? null : <span>Open</span>}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" style={{ marginRight: isCompact ? 0 : '0.5rem' }} />
                {isCompact ? null : <span>Download</span>}
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

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
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
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
    <Card className="overflow-hidden hover:shadow-md transition-shadow flex flex-col">
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
        {resource.professor && (
          <CardDescription className="text-sm">
            Prof. {resource.professor}
          </CardDescription>
        )}
        {creatorInfo && (creatorInfo.username || creatorInfo.fullName) && (
          <CardDescription className="text-sm flex items-center mt-1">
            <UserCircle className="h-3 w-3 mr-1" />
            {creatorInfo.fullName || creatorInfo.username || "Unknown User"}
          </CardDescription>
        )}
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
          <p className="text-white/60 font-medium line-clamp-2 mt-3">{resource.description}</p>

          <div className="flex flex-wrap gap-1 mt-3">
            {resource.tags?.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag.tag_name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t px-2 md:px-6 mt-auto h-[60px]">
        <div className="flex items-center text-sm text-gray-500">
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

        <div className="flex gap-1 md:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              // Completely stop event propagation
              e.preventDefault();
              e.stopPropagation();

              // Share the resource
              shareResource();
            }}
          >
            <Share2 className="h-4 w-4 max-lg:mr-0 lg:mr-2" />
            <span className="hidden lg:inline">Share</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleViewClick}>
            <span className="flex items-center justify-center w-full">
              <Eye className="h-4 w-4 max-lg:mr-0 lg:mr-2" />
              <span className="hidden lg:inline">View</span>
            </span>
          </Button>
          {/* Show download button on all devices */}
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDownloadClick(e);
            }}
            disabled={isDownloading}
          >
              {isDownloading ? (
                <span className="flex items-center justify-center w-full">
                  <Download className="animate-bounce h-4 w-4 max-lg:mr-0 lg:mr-2" />
                  <span className="hidden lg:inline">Downloading...</span>
                </span>
              ) : downloadSuccess ? (
                <span className="flex items-center justify-center w-full">
                  <CheckCircle className="text-green-500 h-4 w-4 max-lg:mr-0 lg:mr-2" />
                  <span className="hidden lg:inline">Downloaded</span>
                </span>
              ) : resource.resource_type === "link" ? (
                <span className="flex items-center justify-center w-full">
                  <ExternalLink className="h-4 w-4 max-lg:mr-0 lg:mr-2" />
                  <span className="hidden lg:inline">View Link</span>
                </span>
              ) : (
                <span className="flex items-center justify-center w-full">
                  <Download className="h-4 w-4 max-lg:mr-0 lg:mr-2" />
                  <span className="hidden lg:inline">Download</span>
                </span>
              )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

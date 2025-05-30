'use client';

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface ShareRoadmapButtonProps {
  roadmapId: string;
  roadmapName: string;
  roadmapDescription?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function ShareRoadmapButton({
  roadmapId,
  roadmapName,
  roadmapDescription = "",
  variant = "outline",
  size = "sm",
  className = "",
}: ShareRoadmapButtonProps) {
  // Function to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Function to share roadmap
  const shareRoadmap = async () => {
    // Use the public-facing URL format for sharing
    const shareUrl = `${window.location.origin}/roadmap/${roadmapId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: roadmapName,
          text: roadmapDescription || `Check out this degree roadmap: ${roadmapName}`,
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

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={(e) => {
        // Completely stop event propagation
        e.preventDefault();
        e.stopPropagation();

        // Share the roadmap
        shareRoadmap();
      }}
    >
      <Share2 className="h-4 w-4 mr-2" />
      Share
    </Button>
  );
} 
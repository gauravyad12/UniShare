'use client';

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface ShareStudyGroupButtonProps {
  groupId: string;
  groupName: string;
  groupDescription?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function ShareStudyGroupButton({
  groupId,
  groupName,
  groupDescription = "",
  variant = "default",
  size = "default",
  className = "",
}: ShareStudyGroupButtonProps) {
  // Function to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Function to share study group
  const shareStudyGroup = async () => {
    // Use the public-facing URL format for sharing
    const shareUrl = `${window.location.origin}/study-group/${groupId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: groupName,
          text: groupDescription,
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

        // Share the study group
        shareStudyGroup();
      }}
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );
}

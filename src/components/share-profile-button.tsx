'use client';

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface ShareProfileButtonProps {
  username: string;
  fullName?: string;
  bio?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function ShareProfileButton({
  username,
  fullName = "",
  bio = "",
  variant = "outline",
  size = "default",
  className = "",
}: ShareProfileButtonProps) {
  // Function to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Function to share profile
  const shareProfile = async () => {
    // Use the public-facing URL format for sharing
    const shareUrl = `${window.location.origin}/u/${username}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: fullName || `@${username}'s Profile`,
          text: bio || `Check out ${fullName || username}'s profile on UniShare`,
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

        // Share the profile
        shareProfile();
      }}
    >
      <Share2 className="h-4 w-4 mr-2" />
      Share
    </Button>
  );
}

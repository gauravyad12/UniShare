"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FollowButtonProps {
  userId: string;
  isFollowing?: boolean;
}

export function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing || false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(!initialIsFollowing);
  const { toast } = useToast();

  // If initialIsFollowing is not provided, check the follow status
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (initialIsFollowing !== undefined) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        setIsCheckingStatus(true);
        const response = await fetch(`/api/users/${userId}/follow/status`, {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
        }
      } catch (error) {
        console.error("Error checking follow status:", error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkFollowStatus();
  }, [userId, initialIsFollowing]);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      console.log(
        `Sending ${isFollowing ? "unfollow" : "follow"} request for user ${userId}`,
      );

      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: isFollowing ? "unfollow" : "follow",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsFollowing(!isFollowing);
        toast({
          title: isFollowing ? "Unfollowed" : "Following",
          description: isFollowing
            ? "You have unfollowed this user"
            : "You are now following this user",
        });
      } else {
        console.error("Follow error:", data.error);
        toast({
          title: "Error",
          description: data.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Follow request error:", error);
      toast({
        title: "Error",
        description: "Something went wrong with the request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Checking...
      </Button>
    );
  }

  return (
    <Button
      onClick={handleFollow}
      variant={isFollowing ? "outline" : "default"}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isFollowing ? (
        <UserCheck className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}

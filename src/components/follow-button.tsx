"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing?: boolean;
  onFollowStatusChange?: (status: {
    isFollowing: boolean;
    followersCount: number;
    followingCount: number;
  }) => void;
}

export function FollowButton({
  userId,
  initialIsFollowing,
  onFollowStatusChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing || false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(
    userId ? true : false,
  );

  // Check follow status on mount
  useEffect(() => {
    let isMounted = true;

    if (userId) {
      const checkFollowStatus = async () => {
        if (!isMounted) return;
        setIsCheckingStatus(true);

        try {
          const response = await fetch(`/api/users/${userId}/follow/status`, {
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
            cache: "no-store",
          });

          if (!isMounted) return;

          if (response.ok) {
            const data = await response.json();
            setIsFollowing(data.isFollowing);

            if (onFollowStatusChange && isMounted) {
              onFollowStatusChange({
                isFollowing: data.isFollowing,
                followersCount: data.followersCount || 0,
                followingCount: data.followingCount || 0,
              });
            }
          }
        } catch (error) {
          console.error("Error checking follow status:", error);
        } finally {
          if (isMounted) {
            setIsCheckingStatus(false);
          }
        }
      };

      checkFollowStatus();
    } else {
      setIsCheckingStatus(false);
    }

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleFollow = async () => {
    if (!userId || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        body: JSON.stringify({
          action: isFollowing ? "unfollow" : "follow",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const newFollowingState = !isFollowing;
        setIsFollowing(newFollowingState);

        // After successful follow/unfollow, fetch updated counts
        if (onFollowStatusChange) {
          try {
            const statusResponse = await fetch(
              `/api/users/${userId}/follow/status`,
              {
                headers: {
                  "Cache-Control": "no-cache",
                  Pragma: "no-cache",
                },
                cache: "no-store",
              },
            );
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              onFollowStatusChange({
                isFollowing: newFollowingState,
                followersCount: statusData.followersCount || 0,
                followingCount: statusData.followingCount || 0,
              });
            }
          } catch (error) {
            console.error("Error fetching updated follow status:", error);
          }
        }
      } else {
        console.error("Error following/unfollowing:", data.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Follow request error:", error);
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

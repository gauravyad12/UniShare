"use client";

import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { UnreadCounts } from "@/types/chat";

interface UnreadMessageBadgeProps {
  groupId: string;
  className?: string;
}

export default function UnreadMessageBadge({
  groupId,
  className = "",
}: UnreadMessageBadgeProps) {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUnreadCounts();
    
    // Set up polling for unread counts
    const interval = setInterval(fetchUnreadCounts, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/study-groups/unread-counts");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch unread counts");
      }

      setUnreadCounts(data.unreadCounts);
    } catch (err) {
      console.error("Error fetching unread counts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !unreadCounts[groupId] || unreadCounts[groupId].unread === 0) {
    return null;
  }

  return (
    <Badge variant="destructive" className={className}>
      {unreadCounts[groupId].unread}
    </Badge>
  );
}

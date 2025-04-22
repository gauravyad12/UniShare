"use client";

import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { createClient } from "@/utils/supabase/client";

interface RealtimeUnreadBadgeProps {
  groupId: string;
  userId: string;
  className?: string;
}

export default function RealtimeUnreadBadge({
  groupId,
  userId,
  className = "",
}: RealtimeUnreadBadgeProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Only fetch and subscribe if we have valid IDs
    if (!groupId || !userId) return;

    fetchUnreadCount();

    // Set up realtime subscription for new messages
    const channel = supabase
      .channel(`group-chat-unread-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_chat_messages',
          filter: `study_group_id=eq.${groupId}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, userId]);

  const fetchUnreadCount = async () => {
    // Skip if we don't have valid IDs
    if (!groupId || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Count all messages that don't have a read status for this user
      const { count, error } = await supabase
        .from('group_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('study_group_id', groupId)
        .not('id', 'in', (
          supabase
            .from('message_read_status')
            .select('message_id')
            .eq('user_id', userId)
        ));

      if (error) {
        console.error("Error in unread count query:", error);
        return;
      }

      setUnreadCount(count || 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || unreadCount === 0) {
    return null;
  }

  return (
    <Badge variant="destructive" className={className}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
}

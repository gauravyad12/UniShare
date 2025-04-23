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

      // First check if there are any messages at all for this group
      const { count: totalCount, error: totalError } = await supabase
        .from('group_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('study_group_id', groupId);

      if (totalError) {
        console.error("Error checking total messages:", totalError);
        return;
      }

      // If there are no messages at all, we can skip the more complex query
      if (totalCount === 0) {
        setUnreadCount(0);
        setIsLoading(false);
        return;
      }

      // Get read message IDs for this user
      const { data: readStatuses, error: readError } = await supabase
        .from('message_read_status')
        .select('message_id')
        .eq('user_id', userId);

      if (readError) {
        console.error("Error fetching read statuses:", readError);
        return;
      }

      // Get all messages for this group
      const { data: messages, error: messagesError } = await supabase
        .from('group_chat_messages')
        .select('id')
        .eq('study_group_id', groupId);

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        return;
      }

      // Create a set of read message IDs for faster lookup
      const readMessageIds = new Set(readStatuses?.map(status => status.message_id) || []);

      // Count messages that aren't in the read set
      const unread = messages?.filter(msg => !readMessageIds.has(msg.id)).length || 0;

      setUnreadCount(unread);
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

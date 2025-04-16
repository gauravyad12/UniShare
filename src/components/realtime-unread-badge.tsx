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
    try {
      setIsLoading(true);
      
      // Get the last read timestamp for this user and group
      const { data: readStatus } = await supabase
        .from('group_chat_read_status')
        .select('last_read_at')
        .eq('study_group_id', groupId)
        .eq('user_id', userId)
        .single();
      
      // If no read status found, count all messages
      if (!readStatus) {
        const { count } = await supabase
          .from('group_chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('study_group_id', groupId);
        
        setUnreadCount(count || 0);
      } else {
        // Count messages newer than last read
        const { count } = await supabase
          .from('group_chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('study_group_id', groupId)
          .gt('created_at', readStatus.last_read_at);
        
        setUnreadCount(count || 0);
      }
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

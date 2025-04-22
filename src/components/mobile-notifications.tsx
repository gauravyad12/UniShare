"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";

type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  link?: string;
};

export default function MobileNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const setupNotifications = async () => {
      // Get the current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Fetch existing notifications to get unread count
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userData.user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (data) {
        setUnreadCount(data.length);
      }

      // Set up realtime subscription for new notifications
      const channel = supabase
        .channel("mobile-notifications-channel")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userData.user.id}`,
          },
          () => {
            setUnreadCount((prev) => prev + 1);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userData.user.id}`,
          },
          (payload) => {
            // If a notification was marked as read
            if (payload.new.is_read && !payload.old.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          },
        )
        .subscribe();

      return channel;
    };

    // Setup notifications and store the channel for cleanup
    let channel: any;
    setupNotifications().then(ch => {
      channel = ch;
    });

    // Cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="relative md:hidden" 
      onClick={() => window.location.href = "/dashboard/notifications"}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center"
          variant="destructive"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      )}
    </Button>
  );
}

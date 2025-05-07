"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  NotificationTabs,
  NotificationTabsContent,
  NotificationTabsList,
  NotificationTabsTrigger
} from "@/components/ui/notification-tabs";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);

      // Get the current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/sign-in");
        return;
      }

      // Fetch existing notifications
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }

      setIsLoading(false);
    };

    fetchNotifications();

    // Set up realtime subscription for new notifications
    const channel = supabase
      .channel("notifications-page-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          if (!newNotification.is_read) {
            setUnreadCount((prev) => prev + 1);
          }
        },
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  const markAsRead = async (id?: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    if (id) {
      // Mark single notification as read
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } else {
      // Mark all as read
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userData.user.id)
        .eq("is_read", false);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="font-medium">Your Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => markAsRead()}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        <NotificationTabs defaultValue="all" className="w-full">
          <NotificationTabsList className="grid w-full grid-cols-2">
            <NotificationTabsTrigger value="all">All</NotificationTabsTrigger>
            <NotificationTabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </NotificationTabsTrigger>
          </NotificationTabsList>

          <NotificationTabsContent value="all">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading notifications...</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 cursor-pointer hover:bg-muted/50 ${!notification.is_read ? "bg-muted/20" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-medium text-sm">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>No notifications</p>
              </div>
            )}
          </NotificationTabsContent>

          <NotificationTabsContent value="unread">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading notifications...</p>
              </div>
            ) : notifications.filter((n) => !n.is_read).length > 0 ? (
              <div className="divide-y">
                {notifications
                  .filter((n) => !n.is_read)
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 cursor-pointer hover:bg-muted/50 bg-muted/20"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-medium text-sm">
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          { addSuffix: true },
                        )}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>No unread notifications</p>
              </div>
            )}
          </NotificationTabsContent>
        </NotificationTabs>
      </div>
    </div>
  );
}

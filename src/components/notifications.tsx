"use client";

import { useState, useEffect } from "react";
import { Bell, Trash2, X, MoreVertical } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { formatDistanceToNow } from "date-fns";
import {
  NotificationTabs,
  NotificationTabsContent,
  NotificationTabsList,
  NotificationTabsTrigger
} from "@/components/ui/notification-tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";

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

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const setupNotifications = async () => {
      // Get the current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Fetch existing notifications
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }

      // Set up realtime subscription for notifications
      const channel = supabase
        .channel("notifications-channel")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userData.user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            console.log(`[Realtime] INSERT event received for notification ${newNotification.id}`);

            setNotifications((prev) => {
              const newNotifications = [newNotification, ...prev];
              console.log(`[Realtime] Updated notifications count: ${newNotifications.length} (was ${prev.length})`);
              return newNotifications;
            });

            if (!newNotification.is_read) {
              setUnreadCount((prev) => {
                const newCount = prev + 1;
                console.log(`[Realtime] Updated unread count: ${newCount} (was ${prev})`);
                return newCount;
              });
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userData.user.id}`,
          },
          (payload) => {
            const deletedId = payload.old.id;
            const wasUnread = !payload.old.is_read;

            console.log(`[Realtime] DELETE event received for notification ${deletedId}, wasUnread: ${wasUnread}`);

            setNotifications((prev) => {
              const newNotifications = prev.filter((n) => n.id !== deletedId);
              console.log(`[Realtime] Updated notifications count: ${newNotifications.length} (was ${prev.length})`);
              return newNotifications;
            });

            if (wasUnread) {
              setUnreadCount((prev) => {
                const newCount = Math.max(0, prev - 1);
                console.log(`[Realtime] Updated unread count: ${newCount} (was ${prev})`);
                return newCount;
              });
            }
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
            const updatedNotification = payload.new as Notification;
            console.log(`[Realtime] UPDATE event received for notification ${updatedNotification.id}`);
            console.log(`[Realtime] Old is_read: ${payload.old.is_read}, New is_read: ${updatedNotification.is_read}`);

            setNotifications((prev) => {
              const newNotifications = prev.map((n) => n.id === updatedNotification.id ? updatedNotification : n);
              console.log(`[Realtime] Updated notification in local state`);
              return newNotifications;
            });

            // If the notification was marked as read, update the unread count
            if (payload.old.is_read === false && updatedNotification.is_read === true) {
              setUnreadCount((prev) => {
                const newCount = Math.max(0, prev - 1);
                console.log(`[Realtime] Updated unread count (marked as read): ${newCount} (was ${prev})`);
                return newCount;
              });
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

  const markAsRead = async (id?: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    if (id) {
      // Mark single notification as read
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      // Update local state
      setNotifications((prev) => {
        const newNotifications = prev.map((n) => (n.id === id ? { ...n, is_read: true } : n));
        console.log(`[Dropdown] Updated notification in local state (marked as read)`);
        return newNotifications;
      });
    } else {
      // Mark all as read
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userData.user.id)
        .eq("is_read", false);

      // Update local state
      setNotifications((prev) => {
        const newNotifications = prev.map((n) => ({ ...n, is_read: true }));
        console.log(`[Dropdown] Marked all notifications as read`);
        return newNotifications;
      });
    }

    // Set unread count to 0 immediately for better UX
    // The realtime subscription will also update this, but it's better to update it immediately
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const deleteNotification = async (id: string, event?: React.MouseEvent) => {
    // Stop propagation if event is provided to prevent triggering the parent click handler
    if (event) {
      event.stopPropagation();
    }

    console.log(`Attempting to delete notification with ID: ${id}`);

    try {
      // Find the notification to delete
      const deletedNotification = notifications.find((n) => n.id === id);

      if (!deletedNotification) {
        console.error(`Notification with ID ${id} not found in local state`);
        toast({
          title: "Error",
          description: "Notification not found",
          variant: "destructive",
        });
        return;
      }

      console.log(`Notification to delete:`, deletedNotification);

      // Try direct database deletion using Supabase client
      const supabase = createClient();
      const { error, count } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      console.log(`Supabase direct delete result:`, { error, count });

      if (error) {
        console.error(`Supabase delete error:`, error);
        throw new Error(error.message || 'Failed to delete notification');
      }

      // Update local state
      setNotifications((prev) => {
        const newNotifications = prev.filter((n) => n.id !== id);
        console.log(`Updated notifications count: ${newNotifications.length} (was ${prev.length})`);
        return newNotifications;
      });

      // Log the unread status of the deleted notification
      console.log(`Deleted notification unread status: ${deletedNotification?.is_read === false ? 'unread' : 'read'}`);

      // Update the unread count immediately if the deleted notification was unread
      // This provides immediate feedback to the user
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount((prev) => {
          const newCount = Math.max(0, prev - 1);
          console.log(`[Dropdown] Updated unread count after deletion: ${newCount} (was ${prev})`);
          return newCount;
        });
      }

      toast({
        title: "Notification deleted",
        description: "The notification has been removed.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete notification",
        variant: "destructive",
      });
    }
  };



  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className={`absolute top-0 right-0.5 flex h-4 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground ${unreadCount > 9 ? 'min-w-[18px] px-1' : 'w-4'}`}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Notifications</h3>
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

          <NotificationTabsContent value="all" className="max-h-[350px] overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 cursor-pointer hover:bg-muted/50 ${!notification.is_read ? "bg-muted/20" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-red-500"
                          onClick={(e) => deleteNotification(notification.id, e)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
              <div className="p-4 text-center text-muted-foreground">
                <p>No notifications</p>
              </div>
            )}
          </NotificationTabsContent>

          <NotificationTabsContent value="unread" className="max-h-[350px] overflow-y-auto">
            {notifications.filter((n) => !n.is_read).length > 0 ? (
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
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-red-500"
                            onClick={(e) => deleteNotification(notification.id, e)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
              <div className="p-4 text-center text-muted-foreground">
                <p>No unread notifications</p>
              </div>
            )}
          </NotificationTabsContent>
        </NotificationTabs>

        <div className="p-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-sm"
            onClick={() => {
              setIsOpen(false);
              window.location.href = "/dashboard/notifications";
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

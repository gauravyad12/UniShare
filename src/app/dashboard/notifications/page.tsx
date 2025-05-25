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
import { ArrowLeft, Trash2, Check, X, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [currentTab, setCurrentTab] = useState<'all' | 'unread'>('all');
  const supabase = createClient();

  // Check if we're on desktop
  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    // Initial check
    checkIfDesktop();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfDesktop);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);

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

    // Set up realtime subscription for notifications
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
          console.log(`[Notifications Page Realtime] INSERT event received for notification ${newNotification.id}`);

          setNotifications((prev) => {
            const newNotifications = [newNotification, ...prev];
            console.log(`[Notifications Page Realtime] Updated notifications count: ${newNotifications.length} (was ${prev.length})`);
            return newNotifications;
          });

          if (!newNotification.is_read) {
            setUnreadCount((prev) => {
              const newCount = prev + 1;
              console.log(`[Notifications Page Realtime] Updated unread count: ${newCount} (was ${prev})`);
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
        },
        (payload) => {
          const deletedId = payload.old.id;
          const wasUnread = !payload.old.is_read;

          console.log(`[Notifications Page Realtime] DELETE event received for notification ${deletedId}, wasUnread: ${wasUnread}`);

          setNotifications((prev) => {
            const newNotifications = prev.filter((n) => n.id !== deletedId);
            console.log(`[Notifications Page Realtime] Updated notifications count: ${newNotifications.length} (was ${prev.length})`);
            return newNotifications;
          });

          if (wasUnread) {
            setUnreadCount((prev) => {
              const newCount = Math.max(0, prev - 1);
              console.log(`[Notifications Page Realtime] Updated unread count: ${newCount} (was ${prev})`);
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
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          console.log(`[Notifications Page Realtime] UPDATE event received for notification ${updatedNotification.id}`);
          console.log(`[Notifications Page Realtime] Old is_read: ${payload.old.is_read}, New is_read: ${updatedNotification.is_read}`);

          setNotifications((prev) => {
            const newNotifications = prev.map((n) => n.id === updatedNotification.id ? updatedNotification : n);
            console.log(`[Notifications Page Realtime] Updated notification in local state`);
            return newNotifications;
          });

          // If the notification was marked as read, update the unread count
          if (payload.old.is_read === false && updatedNotification.is_read === true) {
            setUnreadCount((prev) => {
              const newCount = Math.max(0, prev - 1);
              console.log(`[Notifications Page Realtime] Updated unread count (marked as read): ${newCount} (was ${prev})`);
              return newCount;
            });
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

      // Update local state
      setNotifications((prev) => {
        const newNotifications = prev.map((n) => (n.id === id ? { ...n, is_read: true } : n));
        console.log(`[Notifications Page] Updated notification in local state (marked as read)`);
        return newNotifications;
      });

      // We'll let the realtime subscription handle the unread count update
      // This prevents double-counting when marking as read
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
        console.log(`[Notifications Page] Marked all notifications as read`);
        return newNotifications;
      });

      // Set unread count to 0 immediately for better UX
      // The realtime subscription will also update this, but it's better to update it immediately
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

  const deleteNotification = async (id: string, event?: React.MouseEvent) => {
    // Stop propagation if event is provided to prevent triggering the parent click handler
    if (event) {
      event.stopPropagation();
    }

    console.log(`[Notifications Page] Attempting to delete notification with ID: ${id}`);

    try {
      // Find the notification to delete
      const deletedNotification = notifications.find((n) => n.id === id);

      if (!deletedNotification) {
        console.error(`[Notifications Page] Notification with ID ${id} not found in local state`);
        toast({
          title: "Error",
          description: "Notification not found",
          variant: "destructive",
        });
        return;
      }

      console.log(`[Notifications Page] Notification to delete:`, deletedNotification);

      // Try direct database deletion using Supabase client
      const { error, count } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      console.log(`[Notifications Page] Supabase direct delete result:`, { error, count });

      if (error) {
        console.error(`[Notifications Page] Supabase delete error:`, error);
        throw new Error(error.message || 'Failed to delete notification');
      }

      // Update local state
      setNotifications((prev) => {
        const newNotifications = prev.filter((n) => n.id !== id);
        console.log(`[Notifications Page] Updated notifications count: ${newNotifications.length} (was ${prev.length})`);
        return newNotifications;
      });

      // Log the unread status of the deleted notification
      console.log(`[Notifications Page] Deleted notification unread status: ${deletedNotification?.is_read === false ? 'unread' : 'read'}`);

      // We'll let the realtime subscription handle the unread count update
      // This prevents double-counting when the notification is deleted

      toast({
        title: "Notification deleted",
        description: "The notification has been removed.",
      });
    } catch (error) {
      console.error('[Notifications Page] Error deleting notification:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    if (selectionMode) {
      // If turning off selection mode, clear selections
      setSelectedNotifications([]);
    }
    setSelectionMode(!selectionMode);
  };

  // Toggle selection of a notification
  const toggleNotificationSelection = (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent notification click

    setSelectedNotifications((prev) => {
      if (prev.includes(id)) {
        return prev.filter((notificationId) => notificationId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Select all notifications in the current tab
  const selectAllNotifications = (tabValue: 'all' | 'unread') => {
    const notificationsToSelect = tabValue === 'all'
      ? notifications
      : notifications.filter(n => !n.is_read);

    setSelectedNotifications(notificationsToSelect.map(n => n.id));
  };

  // Check if all notifications in the current tab are selected
  const areAllNotificationsSelected = (tabValue: 'all' | 'unread') => {
    const notificationsInTab = tabValue === 'all'
      ? notifications
      : notifications.filter(n => !n.is_read);

    if (notificationsInTab.length === 0) return false;

    return notificationsInTab.every(n => selectedNotifications.includes(n.id));
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedNotifications([]);
  };

  // Delete selected notifications
  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      // Delete notifications one by one
      for (const id of selectedNotifications) {
        await supabase
          .from('notifications')
          .delete()
          .eq('id', id);
      }

      // Update local state
      setNotifications((prev) =>
        prev.filter((n) => !selectedNotifications.includes(n.id))
      );

      // Clear selections
      setSelectedNotifications([]);

      toast({
        title: "Notifications deleted",
        description: `${selectedNotifications.length} notification(s) have been removed.`,
      });
    } catch (error) {
      console.error('[Notifications Page] Error deleting selected notifications:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete notifications",
        variant: "destructive",
      });
    }
  };

  // Mark selected notifications as read
  const markSelectedAsRead = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      // Mark notifications as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', selectedNotifications);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          selectedNotifications.includes(n.id) ? { ...n, is_read: true } : n
        )
      );

      // Clear selections
      setSelectedNotifications([]);

      toast({
        title: "Notifications marked as read",
        description: `${selectedNotifications.length} notification(s) have been marked as read.`,
      });
    } catch (error) {
      console.error('[Notifications Page] Error marking notifications as read:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  // Mark selected notifications as unread
  const markSelectedAsUnread = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      // Mark notifications as unread
      await supabase
        .from('notifications')
        .update({ is_read: false })
        .in('id', selectedNotifications);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          selectedNotifications.includes(n.id) ? { ...n, is_read: false } : n
        )
      );

      // Clear selections
      setSelectedNotifications([]);

      toast({
        title: "Notifications marked as unread",
        description: `${selectedNotifications.length} notification(s) have been marked as unread.`,
      });
    } catch (error) {
      console.error('[Notifications Page] Error marking notifications as unread:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark notifications as unread",
        variant: "destructive",
      });
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
            <h2 className="font-medium">Your Notifications</h2>
            <div className="flex items-center gap-2">
              {/* Select All button - only show in selection mode and when not all items are selected */}
              {isDesktop && selectionMode && notifications.length > 0 && !areAllNotificationsSelected(currentTab) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => selectAllNotifications(currentTab)}
                >
                  Select All
                </Button>
              )}

              {/* Selection mode toggle - desktop only */}
              {isDesktop && notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={toggleSelectionMode}
                >
                  {selectionMode ? "Cancel Selection" : "Select"}
                </Button>
              )}

              {/* Mass action buttons - only show when in selection mode */}
              {isDesktop && selectionMode && selectedNotifications.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      Actions <MoreHorizontal className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={markSelectedAsRead}>
                      <Check className="mr-2 h-4 w-4" /> Mark as Read
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={markSelectedAsUnread}>
                      <X className="mr-2 h-4 w-4" /> Mark as Unread
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={deleteSelectedNotifications}
                      className="text-red-500 focus:text-red-500"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Mark all as read button - only show when not in selection mode */}
              {(!selectionMode || !isDesktop) && unreadCount > 0 && (
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
        </div>

        <NotificationTabs
          defaultValue="all"
          className="w-full"
          onValueChange={(value) => setCurrentTab(value as 'all' | 'unread')}
        >
          <NotificationTabsList className="grid w-full grid-cols-2">
            <NotificationTabsTrigger
              value="all"
              className="flex-1"
            >
              All
            </NotificationTabsTrigger>
            <NotificationTabsTrigger
              value="unread"
              className="flex-1"
            >
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
                    className={`p-4 cursor-pointer hover:bg-muted/50 ${!notification.is_read ? "bg-muted/20" : ""} ${selectedNotifications.includes(notification.id) ? "bg-muted" : ""}`}
                    onClick={() => !selectionMode && handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      {/* Checkbox for selection mode - desktop only */}
                      {isDesktop && selectionMode && (
                        <div className="mr-2 mt-1" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedNotifications.includes(notification.id)}
                            onCheckedChange={() => toggleNotificationSelection(notification.id, { stopPropagation: () => {} } as React.MouseEvent)}
                            className="mt-0.5"
                          />
                        </div>
                      )}

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
                        {/* Only show delete button when not in selection mode */}
                        {(!selectionMode || !isDesktop) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-red-500"
                            onClick={(e) => deleteNotification(notification.id, e)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
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
                      className={`p-4 cursor-pointer hover:bg-muted/50 bg-muted/20 ${selectedNotifications.includes(notification.id) ? "bg-muted" : ""}`}
                      onClick={() => !selectionMode && handleNotificationClick(notification)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        {/* Checkbox for selection mode - desktop only */}
                        {isDesktop && selectionMode && (
                          <div className="mr-2 mt-1" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedNotifications.includes(notification.id)}
                              onCheckedChange={() => toggleNotificationSelection(notification.id, { stopPropagation: () => {} } as React.MouseEvent)}
                              className="mt-0.5"
                            />
                          </div>
                        )}

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
                          {/* Only show delete button when not in selection mode */}
                          {(!selectionMode || !isDesktop) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-red-500"
                              onClick={(e) => deleteNotification(notification.id, e)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
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

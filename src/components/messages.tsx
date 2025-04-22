"use client";

import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

interface GroupWithLatestMessage {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  created_at: string;
  created_by: string;
  image_url?: string;
  latestMessage: {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    sender_name?: string;
    avatar_url?: string;
  } | null;
}

export default function Messages() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupWithLatestMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // For future implementation
  const supabase = createClient();

  // Fetch user's study groups with latest messages
  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching user groups for messages dropdown...');

      // Use the same API endpoint as the sidebar
      const response = await fetch('/api/user-groups');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch user groups:', errorData);
        throw new Error(`Failed to fetch user groups: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received user groups data:', data);

      if (data.groups && Array.isArray(data.groups)) {
        console.log(`Received ${data.groups.length} user groups with messages`);

        // Log each group's latest message for debugging
        data.groups.forEach((group: GroupWithLatestMessage) => {
          console.log(`Group ${group.name} latest message:`, group.latestMessage);
          if (group.latestMessage) {
            console.log(`  - sender_name: ${group.latestMessage.sender_name}`);
            console.log(`  - content: ${group.latestMessage.content}`);
          }
        });

        setGroups(data.groups);
      } else {
        console.warn('Received unexpected data format for user groups:', data);
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchGroups();

    // Set up realtime subscription for new messages
    const messagesChannel = supabase
      .channel('messages-dropdown-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_chat_messages',
        },
        (payload) => {
          console.log('New group chat message detected:', payload);
          // Refresh groups to update latest messages
          fetchGroups();
        },
      )
      .subscribe((status) => {
        console.log('Messages subscription status:', status);
      });

    // Cleanup function
    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [supabase]);

  // Navigate to group chat
  const navigateToGroupChat = (groupId: string) => {
    router.push(`/dashboard/study-groups?view=${groupId}&chat=true`);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageSquare className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 max-w-[320px]" align="end">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Group Messages</h3>
          </div>
        </div>

        <div className="max-h-[350px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <p>Loading study group messages...</p>
            </div>
          ) : groups.length > 0 ? (
            <div className="divide-y">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => navigateToGroupChat(group.id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={group.image_url || ""}
                        alt={group.name}
                      />
                      <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                        {group.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium text-sm truncate max-w-[180px]">
                          {group.name}
                          {group.is_private && (
                            <span className="ml-1 text-muted-foreground">🔒</span>
                          )}
                        </p>
                      </div>
                      {group.latestMessage ? (
                        <>
                          <p className="text-sm text-muted-foreground truncate">
                            <span className="font-medium">
                              {group.latestMessage.sender_id === group.created_by
                                ? "Admin: "
                                : group.latestMessage.sender_name
                                ? `${group.latestMessage.sender_name.split(' ')[0]}: `
                                : ""}
                            </span>
                            {group.latestMessage.content.length > 15
                              ? `${group.latestMessage.content.substring(0, 15)}...`
                              : group.latestMessage.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {group.latestMessage.created_at ?
                              formatDistanceToNow(
                                new Date(group.latestMessage.created_at),
                                { addSuffix: true }
                              ) : 'Recently'}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No messages yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <p>No study group messages</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

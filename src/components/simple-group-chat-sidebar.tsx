"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type SimpleGroupChatSidebarProps = {
  currentGroupId?: string;
};

interface GroupWithLatestMessage {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  created_by: string;
  created_at: string;
  latestMessage: any | null;
  creator_profile?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export default function SimpleGroupChatSidebar({ currentGroupId }: SimpleGroupChatSidebarProps) {
  const [groups, setGroups] = useState<GroupWithLatestMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Only fetch the current group to avoid RLS issues
      if (!currentGroupId) {
        console.log('No current group ID, showing empty sidebar');
        setGroups([]);
        setLoading(false);
        return;
      }

      console.log('Fetching only the current group:', currentGroupId);

      // Fetch the current group directly
      const { data: currentGroup, error: groupError } = await supabase
        .from("study_groups")
        .select("*")
        .eq("id", currentGroupId)
        .single();
        
      if (groupError) {
        console.error('Error fetching current group:', groupError);
        throw groupError;
      }

      if (!currentGroup) {
        console.log('Current group not found');
        setGroups([]);
        setLoading(false);
        return;
      }

      console.log('Current group fetched:', currentGroup.name);

      // Fetch creator profile
      const { data: creatorProfile } = await supabase
        .from("user_profiles")
        .select("id, username, full_name, avatar_url")
        .eq("id", currentGroup.created_by)
        .single();
        
      // Add creator profile to group
      if (creatorProfile) {
        currentGroup.creator_profile = creatorProfile;
      }

      // Use only the current group
      const groupsData = [currentGroup];

      // Get latest message for each group
      if (!groupsData || groupsData.length === 0) {
        console.log('No groups data returned from the query');
        setGroups([]);
        setLoading(false);
        return;
      }

      try {
        const groupsWithLatestMessage = await Promise.all(
          groupsData.map(async (group) => {
            console.log('Processing group:', group.id, group.name);
            try {
              const { data: latestMessage, error } = await supabase
                .from("group_chat_messages_with_profiles")
                .select("*")
                .eq("study_group_id", group.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();
                
              if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
                console.error('Error fetching latest message for group', group.id, error);
              }

              return {
                ...group,
                latestMessage: latestMessage || null
              };
            } catch (err) {
              console.error('Error processing group', group.id, err);
              return {
                ...group,
                latestMessage: null
              };
            }
          })
        );

        console.log("Groups with messages processed:", groupsWithLatestMessage.length);
        setGroups(groupsWithLatestMessage);
      } catch (err) {
        console.error('Error processing groups with messages:', err);
        // Fallback to just setting the groups without messages
        setGroups(groupsData.map(group => ({ ...group, latestMessage: null })));
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch the current group when it changes
  useEffect(() => {
    if (currentGroupId) {
      console.log('Current group ID changed, ensuring it is in the sidebar:', currentGroupId);
      fetchGroups();
    }
  }, [currentGroupId]);

  useEffect(() => {
    console.log('SimpleGroupChatSidebar mounted, fetching groups...');
    // Initial fetch
    fetchGroups();

    // Set up realtime subscription for new messages
    const messagesChannel = supabase
      .channel('group-chat-sidebar-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_chat_messages',
      }, (payload) => {
        console.log('New message detected:', payload);
        // Refetch groups to update latest messages
        fetchGroups();
      })
      .subscribe();

    return () => {
      console.log('SimpleGroupChatSidebar unmounting, removing channels...');
      supabase.removeChannel(messagesChannel);
    };
  }, []);

  return (
    <div className="h-full border-r border-b-0 border-t-0 border-l-0 rounded-none shadow-none">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="text-lg flex items-center gap-2 font-medium">
            <MessageSquare className="h-5 w-5 text-primary" />
            Current Chat
          </div>
        </div>
      </div>
      
      <div className="p-0">
        <ScrollArea className="h-[calc(100vh-69px-7.5rem)]">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : groups.length > 0 ? (
            <div className="divide-y divide-border">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/dashboard/study-groups?view=${group.id}&chat=true`}
                  className={`block p-3 hover:bg-muted/50 transition-colors ${
                    currentGroupId === group.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      {group.image_url ? (
                        <AvatarImage src={group.image_url} alt={group.name} />
                      ) : (
                        <AvatarFallback>
                          <Users className="h-5 w-5" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-medium text-sm truncate">{group.name}</h3>
                        {group.latestMessage && (
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(group.latestMessage.created_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {group.latestMessage ? (
                          <>
                            <span className="font-medium">
                              {group.latestMessage.sender_id === group.created_by
                                ? "Admin: "
                                : group.latestMessage.sender_name
                                ? `${group.latestMessage.sender_name.split(' ')[0]}: `
                                : ""}
                            </span>
                            {group.latestMessage.content}
                          </>
                        ) : (
                          "No messages yet"
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
              <h3 className="font-medium text-sm">No group chats found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Join or create a study group to start chatting
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/dashboard/study-groups">Browse Study Groups</Link>
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

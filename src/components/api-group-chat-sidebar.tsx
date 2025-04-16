"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MessageSquare, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type ApiGroupChatSidebarProps = {
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
}

export default function ApiGroupChatSidebar({ currentGroupId }: ApiGroupChatSidebarProps) {
  const [groups, setGroups] = useState<GroupWithLatestMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGroups() {
      try {
        setLoading(true);
        setError(null);

        // Fetch groups from our API route
        const response = await fetch(`/api/user-groups?currentGroupId=${currentGroupId || ''}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch groups');
        }

        const data = await response.json();
        console.log('Fetched groups from API:', data.groups);

        // Always ensure the current group is included
        if (currentGroupId && data.groups && !data.groups.some((g: any) => g.id === currentGroupId)) {
          // Current group not in the list, fetch it separately
          try {
            const groupResponse = await fetch(`/api/study-groups/${currentGroupId}`);
            if (groupResponse.ok) {
              const groupData = await groupResponse.json();
              if (groupData.group) {
                data.groups.push({
                  ...groupData.group,
                  latestMessage: null
                });
              }
            }
          } catch (err) {
            console.error('Error fetching current group:', err);
          }
        }

        setGroups(data.groups || []);
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError('Failed to load groups');
        setGroups([]);
      } finally {
        setLoading(false);
      }
    }

    fetchGroups();
  }, [currentGroupId]);

  // Filter groups based on search query
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Always ensure current group is at the top of the list
  const sortedGroups = [...filteredGroups].sort((a, b) => {
    if (a.id === currentGroupId) return -1;
    if (b.id === currentGroupId) return 1;
    return 0;
  });

  return (
    <div className="h-full border-r border-b-0 border-t-0 border-l-0 rounded-none shadow-none">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="text-lg flex items-center gap-2 font-medium">
            <MessageSquare className="h-5 w-5 text-primary" />
            Group Chats
          </div>
        </div>

        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : sortedGroups.length > 0 ? (
            <div className="divide-y divide-border">
              {sortedGroups.map((group) => (
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

"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MessageSquare, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import Link from "next/link";

type MinimalGroupChatSidebarProps = {
  currentGroupId: string;
  groupName: string;
  groupImage?: string;
};

export default function MinimalGroupChatSidebar({ 
  currentGroupId, 
  groupName,
  groupImage 
}: MinimalGroupChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Simple client-side search
  const showGroup = groupName.toLowerCase().includes(searchQuery.toLowerCase());
  
  return (
    <div className="h-full border-r border-b-0 border-t-0 border-l-0 rounded-none shadow-none">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="text-lg flex items-center gap-2 font-medium">
            <MessageSquare className="h-5 w-5 text-primary" />
            Group Chat
          </div>
        </div>
        
        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search chat..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="p-0">
        <ScrollArea className="h-[calc(100vh-69px-7.5rem)]">
          {showGroup ? (
            <div className="divide-y divide-border">
              <Link
                href={`/dashboard/study-groups?view=${currentGroupId}&chat=true`}
                className="block p-3 bg-muted"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    {groupImage ? (
                      <AvatarImage src={groupImage} alt={groupName} />
                    ) : (
                      <AvatarFallback>
                        <Users className="h-5 w-5" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-medium text-sm truncate">{groupName}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      Current group chat
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
              <h3 className="font-medium text-sm">No matches found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Try a different search term
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

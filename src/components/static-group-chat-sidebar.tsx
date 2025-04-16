"use client";

import { MessageSquare, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type StaticGroupChatSidebarProps = {
  currentGroupId?: string;
  groupName: string;
  groupImage?: string;
};

export default function StaticGroupChatSidebar({ 
  currentGroupId, 
  groupName,
  groupImage
}: StaticGroupChatSidebarProps) {
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
        </ScrollArea>
      </div>
    </div>
  );
}

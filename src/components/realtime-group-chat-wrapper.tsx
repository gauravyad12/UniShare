"use client";

import RealtimeGroupChat from "./realtime-group-chat";

interface RealtimeGroupChatWrapperProps {
  groupId: string;
  currentUserId: string;
  isAdmin?: boolean;
}

export default function RealtimeGroupChatWrapper({
  groupId,
  currentUserId,
  isAdmin = false,
}: RealtimeGroupChatWrapperProps) {
  return (
    <RealtimeGroupChat 
      groupId={groupId} 
      currentUserId={currentUserId}
      isAdmin={isAdmin}
    />
  );
}

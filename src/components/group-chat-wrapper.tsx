"use client";

import GroupChat from "./group-chat";

interface GroupChatWrapperProps {
  groupId: string;
  currentUserId: string;
  isAdmin?: boolean;
}

export default function GroupChatWrapper({
  groupId,
  currentUserId,
  isAdmin = false,
}: GroupChatWrapperProps) {
  return (
    <GroupChat 
      groupId={groupId} 
      currentUserId={currentUserId}
      isAdmin={isAdmin}
    />
  );
}

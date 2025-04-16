"use client";

import RealtimeUnreadBadge from "./realtime-unread-badge";

interface RealtimeUnreadBadgeWrapperProps {
  groupId: string;
  userId: string;
  className?: string;
}

export default function RealtimeUnreadBadgeWrapper({
  groupId,
  userId,
  className = "",
}: RealtimeUnreadBadgeWrapperProps) {
  return (
    <RealtimeUnreadBadge
      groupId={groupId}
      userId={userId}
      className={className}
    />
  );
}

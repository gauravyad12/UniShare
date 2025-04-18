export interface ChatMessage {
  id: string;
  study_group_id: string;
  sender_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
}

export interface UnreadCounts {
  [groupId: string]: {
    total: number;
    unread: number;
  };
}

export interface TypingStatus {
  id: string;
  study_group_id: string;
  user_id: string;
  is_typing: boolean;
  updated_at: string;
  // Include user profile information for display
  full_name?: string;
  username?: string;
  avatar_url?: string;
}

export interface TypingUsers {
  [userId: string]: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
    updated_at: string;
  };
}

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
import { Input } from "@/components/ui/input";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    avatar_url?: string;
    full_name?: string;
    username?: string;
  };
};

type Conversation = {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
};

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const fetchConversations = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Get all conversations
      const { data: messagesData } = await supabase
        .from("messages")
        .select(
          "id, sender_id, receiver_id, content, is_read, created_at, sender:sender_id(avatar_url, full_name, username)",
        )
        .or(
          `sender_id.eq.${userData.user.id},receiver_id.eq.${userData.user.id}`,
        )
        .order("created_at", { ascending: false });

      if (!messagesData) return;

      // Process messages into conversations
      const conversationsMap = new Map<string, Conversation>();
      let totalUnread = 0;

      messagesData.forEach((message) => {
        const isIncoming = message.receiver_id === userData.user.id;
        const otherUserId = isIncoming
          ? message.sender_id
          : message.receiver_id;

        if (!conversationsMap.has(otherUserId)) {
          const sender = message.sender as any;
          conversationsMap.set(otherUserId, {
            user_id: otherUserId,
            username: sender?.username || "User",
            full_name: sender?.full_name || "Unknown User",
            avatar_url: sender?.avatar_url,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: isIncoming && !message.is_read ? 1 : 0,
          });

          if (isIncoming && !message.is_read) {
            totalUnread++;
          }
        } else {
          const conversation = conversationsMap.get(otherUserId)!;
          if (isIncoming && !message.is_read) {
            conversation.unread_count++;
            totalUnread++;
          }
        }
      });

      setConversations(Array.from(conversationsMap.values()));
      setUnreadCount(totalUnread);
    };

    fetchConversations();

    // Set up realtime subscription for new messages
    const setupRealtimeSubscription = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const channel = supabase
          .channel("messages-channel")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `receiver_id=eq.${data.user.id}`,
            },
            (payload) => {
              const newMessage = payload.new as Message;
              // Update conversations and unread count
              fetchConversations();
              // If active conversation matches the sender, fetch new messages
              if (activeConversation === newMessage.sender_id) {
                fetchMessages(newMessage.sender_id);
              }
            },
          )
          .subscribe();

        return channel;
      }
      return null;
    };

    // Create and store the channel
    let channel: any;
    setupRealtimeSubscription().then((ch) => {
      channel = ch;
    });

    // Cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, activeConversation]);

  const fetchMessages = async (userId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase
      .from("messages")
      .select(
        "id, sender_id, receiver_id, content, is_read, created_at, sender:sender_id(avatar_url, full_name, username)",
      )
      .or(
        `and(sender_id.eq.${userData.user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${userData.user.id})`,
      )
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);

      // Mark incoming messages as read
      const unreadMessageIds = data
        .filter((msg) => msg.receiver_id === userData.user.id && !msg.is_read)
        .map((msg) => msg.id);

      if (unreadMessageIds.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", unreadMessageIds);

        // Update unread count
        setConversations((prev) =>
          prev.map((conv) =>
            conv.user_id === userId ? { ...conv, unread_count: 0 } : conv,
          ),
        );
        setUnreadCount((prev) => prev - unreadMessageIds.length);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    await supabase.from("messages").insert({
      sender_id: userData.user.id,
      receiver_id: activeConversation,
      content: newMessage,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    setNewMessage("");
    fetchMessages(activeConversation);
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
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Messages</h3>
            {activeConversation && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8"
                onClick={() => setActiveConversation(null)}
              >
                Back to conversations
              </Button>
            )}
          </div>
        </div>

        {!activeConversation ? (
          // Conversations list
          <div className="max-h-[350px] overflow-y-auto">
            {conversations.length > 0 ? (
              <div className="divide-y">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.user_id}
                    className={`p-4 cursor-pointer hover:bg-muted/50 ${conversation.unread_count > 0 ? "bg-muted/20" : ""}`}
                    onClick={() => {
                      setActiveConversation(conversation.user_id);
                      fetchMessages(conversation.user_id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={conversation.avatar_url || ""}
                          alt={conversation.full_name}
                        />
                        <AvatarFallback>
                          {conversation.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium text-sm">
                            {conversation.full_name}
                          </p>
                          {conversation.unread_count > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.last_message}
                        </p>
                        {conversation.last_message_time && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(
                              new Date(conversation.last_message_time),
                              { addSuffix: true },
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <p>No conversations yet</p>
              </div>
            )}
          </div>
        ) : (
          // Active conversation
          <div className="flex flex-col h-[350px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length > 0 ? (
                messages.map((message) => {
                  const { data: userData } = supabase.auth.getUser();
                  const isOutgoing = message.sender_id === userData.user?.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${isOutgoing ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No messages yet. Start a conversation!
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm">
                  Send
                </Button>
              </form>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

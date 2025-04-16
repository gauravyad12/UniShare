"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Send, Pin, Trash, RefreshCw, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { createClient } from "@/utils/supabase/client";
import LoadingSpinner from "./loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface ChatMessage {
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

interface RealtimeGroupChatProps {
  groupId: string;
  currentUserId: string;
  isAdmin?: boolean;
}

export default function RealtimeGroupChat({
  groupId,
  currentUserId,
  isAdmin = false,
}: RealtimeGroupChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages();
    fetchPinnedMessages();

    // Set up realtime subscription
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_chat_messages',
          filter: `study_group_id=eq.${groupId}`
        },
        (payload) => {
          handleNewMessage(payload.new as ChatMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'group_chat_messages',
          filter: `study_group_id=eq.${groupId}`
        },
        (payload) => {
          handleMessageUpdate(payload.new as ChatMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'group_chat_messages',
          filter: `study_group_id=eq.${groupId}`
        },
        (payload) => {
          handleMessageDelete(payload.old as ChatMessage);
        }
      )
      .subscribe();

    // Update read status when component mounts
    updateReadStatus();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  // Scroll to bottom when messages change, but only if we're already at the bottom
  // or if it's the first load
  useEffect(() => {
    if (isFirstLoad && messages.length > 0) {
      scrollToBottom();
      setIsFirstLoad(false);
    } else if (messages.length > 0 && isNearBottom()) {
      scrollToBottom();
    }
  }, [messages]);

  const isNearBottom = () => {
    if (!scrollAreaRef.current) return false;

    const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollElement) return false;

    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Consider "near bottom" if within 100px of the bottom
    return distanceFromBottom < 100;
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNewMessage = async (newMsg: ChatMessage) => {
    // If the message is from the current user, we already added it optimistically
    if (newMsg.sender_id === currentUserId) return;

    // Fetch the complete message with profile info from the API
    try {
      const response = await fetch(`/api/study-groups/${groupId}/messages/${newMsg.id}`);
      const data = await response.json();

      if (response.ok && data.message) {
        setMessages(prev => [data.message, ...prev]);

        // If the message is pinned, add it to pinned messages
        if (data.message.is_pinned) {
          setPinnedMessages(prev => [data.message, ...prev]);
        }
      } else {
        // Fallback to direct fetch if API fails
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, username, avatar_url')
          .eq('id', newMsg.sender_id)
          .single();

        const messageWithProfile = {
          ...newMsg,
          full_name: profile?.full_name,
          username: profile?.username,
          avatar_url: profile?.avatar_url
        };

        setMessages(prev => [messageWithProfile, ...prev]);

        // If the message is pinned, add it to pinned messages
        if (newMsg.is_pinned) {
          setPinnedMessages(prev => [messageWithProfile, ...prev]);
        }
      }

      // Update read status if we're actively viewing
      updateReadStatus();
    } catch (err) {
      console.error("Error handling new message:", err);
    }
  };

  const handleMessageUpdate = (updatedMsg: ChatMessage) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } : msg
      )
    );

    // Update pinned messages
    if (updatedMsg.is_pinned) {
      // Add to pinned if not already there
      if (!pinnedMessages.some(msg => msg.id === updatedMsg.id)) {
        const message = messages.find(msg => msg.id === updatedMsg.id);
        if (message) {
          setPinnedMessages(prev => [{ ...message, is_pinned: true }, ...prev]);
        }
      }
    } else {
      // Remove from pinned
      setPinnedMessages(prev => prev.filter(msg => msg.id !== updatedMsg.id));
    }
  };

  const handleMessageDelete = (deletedMsg: ChatMessage) => {
    setMessages(prev => prev.filter(msg => msg.id !== deletedMsg.id));
    setPinnedMessages(prev => prev.filter(msg => msg.id !== deletedMsg.id));
  };

  const fetchMessages = async (before?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Use the API endpoint instead of direct Supabase query
      const url = new URL(`/api/study-groups/${groupId}/messages`, window.location.origin);
      const limit = 50;
      url.searchParams.append("limit", limit.toString());

      if (before) {
        url.searchParams.append("before", before);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch messages");
      }

      if (before) {
        // Append older messages
        setMessages(prev => [...prev, ...data.messages]);
      } else {
        // Replace all messages
        setMessages(data.messages);
      }

      // Check if there are more messages to load
      setHasMore(data.hasMore);

      // Update read status
      updateReadStatus();
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching messages");
      toast({
        title: "Error",
        description: err.message || "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchPinnedMessages = async () => {
    try {
      // Use the API endpoint for pinned messages
      const url = new URL(`/api/study-groups/${groupId}/messages/pinned`, window.location.origin);
      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch pinned messages");
      }

      setPinnedMessages(data.pinnedMessages || []);
    } catch (err) {
      console.error("Error fetching pinned messages:", err);
    }
  };

  const updateReadStatus = async () => {
    try {
      // Check if we already have a read status for this group
      const { data: existingStatus } = await supabase
        .from('group_chat_read_status')
        .select('id')
        .eq('study_group_id', groupId)
        .eq('user_id', currentUserId)
        .single();

      const now = new Date().toISOString();

      if (existingStatus) {
        // Update existing read status
        await supabase
          .from('group_chat_read_status')
          .update({ last_read_at: now })
          .eq('id', existingStatus.id);
      } else {
        // Create new read status
        await supabase
          .from('group_chat_read_status')
          .insert({
            study_group_id: groupId,
            user_id: currentUserId,
            last_read_at: now
          });
      }
    } catch (err) {
      console.error("Error updating read status:", err);
    }
  };

  const loadMoreMessages = () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return;

    setIsLoadingMore(true);
    const oldestMessage = messages[messages.length - 1];
    fetchMessages(oldestMessage.created_at);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollElement = target.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollElement) return;

    // Load more when scrolled near the bottom
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const distanceFromTop = scrollTop;

    if (distanceFromTop < 100 && hasMore && !isLoadingMore) {
      loadMoreMessages();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setIsSending(true);
      setError(null);

      // Create a temporary message for optimistic UI update
      const tempId = crypto.randomUUID();
      const tempMessage: ChatMessage = {
        id: tempId,
        study_group_id: groupId,
        sender_id: currentUserId,
        content: newMessage.trim(),
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Add current user's profile info if available
      };

      // Optimistically add the message to the UI
      setMessages(prev => [tempMessage, ...prev]);
      setNewMessage("");

      // Send the message to the server
      const { data: message, error: insertError } = await supabase
        .from('group_chat_messages')
        .insert({
          study_group_id: groupId,
          sender_id: currentUserId,
          content: tempMessage.content,
        })
        .select()
        .single();

      if (insertError) {
        // Remove the temporary message if there was an error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        throw new Error(insertError.message);
      }

      // Update the temporary message with the real one
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId ? { ...msg, id: message.id } : msg
        )
      );

      // Update read status
      updateReadStatus();
    } catch (err: any) {
      setError(err.message || "An error occurred while sending message");
      toast({
        title: "Error",
        description: err.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('group_chat_messages')
        .delete()
        .eq('id', messageId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handlePinMessage = async (messageId: string, isPinned: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('group_chat_messages')
        .update({ is_pinned: !isPinned })
        .eq('id', messageId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      toast({
        title: "Success",
        description: isPinned ? "Message unpinned" : "Message pinned",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update message",
        variant: "destructive",
      });
    }
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (err) {
      return "some time ago";
    }
  };

  const getInitials = (name?: string, username?: string) => {
    if (name && name.length > 0) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    }
    if (username && username.length > 0) {
      return username.substring(0, 2).toUpperCase();
    }
    return "UN";
  };

  if (isLoading && messages.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <div className="bg-muted/40 p-3 rounded-md mb-4">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <Pin className="h-4 w-4 mr-1" /> Pinned Messages
          </h3>
          <div className="space-y-2">
            {pinnedMessages.slice(0, 3).map((message) => (
              <div key={message.id} className="text-sm bg-background p-2 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={message.avatar_url || ""} alt={message.full_name || message.username || "User"} />
                    <AvatarFallback>{getInitials(message.full_name, message.username)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{message.full_name || message.username || "Unknown User"}</span>
                </div>
                <p className="ml-7">{message.content}</p>
              </div>
            ))}
            {pinnedMessages.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{pinnedMessages.length - 3} more pinned messages
              </p>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea
        className="flex-1 pr-4"
        ref={scrollAreaRef}
        onScroll={handleScroll}
      >
        {error && (
          <Alert variant="destructive" className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {messages.map((message, index) => {
            const isCurrentUser = message.sender_id === currentUserId;
            const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;

            return (
              <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} max-w-[80%] gap-2`}>
                  {showAvatar && !isCurrentUser && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={message.avatar_url || ""} alt={message.full_name || message.username || "User"} />
                      <AvatarFallback>{getInitials(message.full_name, message.username)}</AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    {showAvatar && (
                      <div className={`text-xs text-muted-foreground mb-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                        {isCurrentUser ? 'You' : (message.full_name || message.username || "Unknown User")}
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      {isCurrentUser && (
                        <div className="flex flex-col items-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleDeleteMessage(message.id)}
                                >
                                  <Trash className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete message</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {isAdmin && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handlePinMessage(message.id, message.is_pinned)}
                                  >
                                    <Pin className={`h-4 w-4 ${message.is_pinned ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{message.is_pinned ? 'Unpin message' : 'Pin message'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      )}

                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isCurrentUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        } ${message.is_pinned ? 'border-l-4 border-primary' : ''}`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <div className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {formatMessageTime(message.created_at)}
                        </div>
                      </div>

                      {!isCurrentUser && isAdmin && (
                        <div className="flex flex-col items-start gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleDeleteMessage(message.id)}
                                >
                                  <Trash className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete message</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handlePinMessage(message.id, message.is_pinned)}
                                >
                                  <Pin className={`h-4 w-4 ${message.is_pinned ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{message.is_pinned ? 'Unpin message' : 'Pin message'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                  </div>

                  {showAvatar && isCurrentUser && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={message.avatar_url || ""} alt={message.full_name || message.username || "User"} />
                      <AvatarFallback>{getInitials(message.full_name, message.username)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            );
          })}

          {messages.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}

          {hasMore && (
            <div className="py-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMoreMessages}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load more messages"
                )}
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="mt-4">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] resize-none"
            disabled={isSending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="mb-1"
          >
            {isSending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

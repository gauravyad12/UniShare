"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Send, Pin, Trash, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ChatMessage } from "@/types/chat";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface GroupChatProps {
  groupId: string;
  currentUserId: string;
  isAdmin?: boolean;
}

export default function GroupChat({
  groupId,
  currentUserId,
  isAdmin = false,
}: GroupChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages();
    fetchPinnedMessages();
    // Set up polling for new messages
    const interval = setInterval(() => {
      if (messages.length > 0) {
        fetchNewMessages();
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [groupId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const fetchMessages = async (before?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const url = new URL(`/api/study-groups/${groupId}/messages`, window.location.origin);
      if (before) {
        url.searchParams.append("before", before);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch messages");
      }

      if (before) {
        // Prepend older messages
        setMessages(prev => [...data.messages, ...prev]);
      } else {
        // Replace all messages
        setMessages(data.messages);
      }
      
      setHasMore(data.hasMore);
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

  const fetchNewMessages = async () => {
    if (messages.length === 0) return;
    
    try {
      const latestMessageTime = messages[0]?.created_at;
      if (!latestMessageTime) return;

      const url = new URL(`/api/study-groups/${groupId}/messages`, window.location.origin);
      url.searchParams.append("after", latestMessageTime);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch new messages");
      }

      if (data.messages.length > 0) {
        setMessages(prev => [...data.messages, ...prev]);
      }
    } catch (err) {
      console.error("Error fetching new messages:", err);
    }
  };

  const fetchPinnedMessages = async () => {
    try {
      const response = await fetch(`/api/study-groups/${groupId}/messages/pinned`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch pinned messages");
      }

      setPinnedMessages(data.pinnedMessages);
    } catch (err) {
      console.error("Error fetching pinned messages:", err);
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
    // Load more when scrolled near the top
    if (target.scrollTop < 100 && hasMore && !isLoadingMore) {
      loadMoreMessages();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setIsSending(true);
      setError(null);

      const response = await fetch(`/api/study-groups/${groupId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      // Add the new message to the list
      setMessages(prev => [data.message, ...prev]);
      setNewMessage("");
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
      const response = await fetch(`/api/study-groups/${groupId}/messages/${messageId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete message");
      }

      // Remove the message from the list
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      // Also remove from pinned messages if it was pinned
      setPinnedMessages(prev => prev.filter(msg => msg.id !== messageId));

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
      const response = await fetch(`/api/study-groups/${groupId}/messages/${messageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_pinned: !isPinned }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update message");
      }

      // Update the message in the list
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_pinned: !isPinned } : msg
        )
      );

      // Update pinned messages
      if (!isPinned) {
        // Add to pinned messages
        const message = messages.find(msg => msg.id === messageId);
        if (message) {
          setPinnedMessages(prev => [{ ...message, is_pinned: true }, ...prev]);
        }
      } else {
        // Remove from pinned messages
        setPinnedMessages(prev => prev.filter(msg => msg.id !== messageId));
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
        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
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
              
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="mt-4">
        {error && (
          <div className="bg-destructive/10 text-destructive p-2 rounded-md mb-2 text-sm">
            {error}
          </div>
        )}
        
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

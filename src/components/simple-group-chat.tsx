"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { formatDistanceToNow } from "date-fns";
import MinimalGroupChatSidebar from "./minimal-group-chat-sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Users,
  ArrowLeft,
  X,
  Send,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useToast } from "./ui/use-toast";

interface SimpleGroupChatProps {
  group: any;
}

export default function SimpleGroupChat({
  group,
}: SimpleGroupChatProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log('SimpleGroupChat rendering with group:', group);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  // Set up polling for new messages
  useEffect(() => {
    if (!group.id || !userId) return;

    const pollInterval = setInterval(async () => {
      try {
        const supabase = createClient();
        const { data: messagesData, error: messagesError } = await supabase
          .rpc('get_messages_with_profiles', {
            p_group_id: group.id,
            p_user_id: userId,
            p_limit: 100
          });

        if (messagesError) {
          console.error('Error polling messages:', messagesError);
        } else if (messagesData && messagesData.length > 0) {
          // Only update if we have new messages
          if (messagesData.length !== messages.length) {
            console.log('New messages found during polling, updating...');
            setMessages(messagesData);
          }
        }
      } catch (error) {
        console.error('Error in message polling:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [group.id, userId, messages.length]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Get user profile
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setUserProfile(profile);

        // Check if user is a member of this group or the creator
        const isCreator = group.created_by === user.id;
        console.log('Is user the creator?', isCreator, 'Creator ID:', group.created_by, 'User ID:', user.id);

        if (isCreator) {
          console.log('User is the creator of this group');
        } else {
          // Use the stored procedure to check membership
          try {
            const { data: membershipData, error: membershipError } = await supabase
              .rpc('check_study_group_membership', {
                p_group_id: group.id,
                p_user_id: user.id
              });

            console.log('Membership check result:', membershipData);
            console.log('Membership check error:', membershipError);

            const isUserMember = membershipData && membershipData.length > 0 && membershipData[0].is_member;
            console.log('User membership status:', isUserMember);

            // If user is not a member or creator, redirect to study groups page
            if (!isUserMember) {
              toast({
                title: "Access Denied",
                description: "You must be a member of this study group to view the chat.",
                variant: "destructive",
              });
              router.push('/dashboard/study-groups');
              return;
            }
          } catch (error) {
            console.error('Error checking membership:', error);

            // Fallback to checking user's study groups
            const { data: userGroups } = await supabase
              .rpc('get_user_study_groups', {
                p_user_id: user.id
              });

            const isUserMember = userGroups && userGroups.some((g: { id: string }) => g.id === group.id);
            console.log('User membership status (fallback):', isUserMember);

            if (!isUserMember) {
              toast({
                title: "Access Denied",
                description: "You must be a member of this study group to view the chat.",
                variant: "destructive",
              });
              router.push('/dashboard/study-groups');
              return;
            }
          }
        }

        // Get messages using the stored procedure directly
        try {
          const { data: messagesData, error: messagesError } = await supabase
            .rpc('get_messages_with_profiles', {
              p_group_id: group.id,
              p_user_id: user.id,
              p_limit: 100
            });

          if (messagesError) {
            console.error('Error fetching messages:', messagesError);
          } else {
            setMessages(messagesData || []);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }

        // Subscribe to new messages
        console.log('Setting up subscription for group:', group.id);
        const messageSubscription = supabase
          .channel(`group_chat_messages:${group.id}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'group_chat_messages',
            filter: `study_group_id=eq.${group.id}`
          }, async (payload: any) => {
            console.log('Received new message:', payload.new);
            // Fetch all messages to get the latest with profile info
            try {
              const { data: messagesData, error: messagesError } = await supabase
                .rpc('get_messages_with_profiles', {
                  p_group_id: group.id,
                  p_user_id: user.id,
                  p_limit: 100
                });

              if (messagesError) {
                console.error('Error fetching messages:', messagesError);
                // Fallback if the API fails
                setMessages(prevMessages => [...prevMessages, payload.new]);
              } else if (messagesData) {
                console.log('Refreshed messages with profiles');
                setMessages(messagesData);
              }
            } catch (error) {
              console.error('Error fetching messages:', error);
              // Fallback if the API fails
              setMessages(prevMessages => [...prevMessages, payload.new]);
            }
          })
          .subscribe((status: any) => {
            console.log('Subscription status:', status);
          });

        setSubscription(messageSubscription);
      }

      setLoading(false);
    };

    fetchData();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        const supabase = createClient();
        supabase.removeChannel(subscription);
      }
    };
  }, [group.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    try {
      setSending(true);
      const supabase = createClient();

      // Use the simplified stored procedure to send the message
      console.log('Sending message to group:', group.id);
      const { data, error } = await supabase
        .rpc('send_message_with_profile', {
          p_group_id: group.id,
          p_user_id: userId,
          p_content: newMessage.trim()
        });
      console.log('Message sent, response:', data);

      if (error) {
        throw error;
      }

      // Clear the input
      setNewMessage("");

      // The function returns the message with profile information
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('Message sent with profile:', data[0]);

        // Add the message to the chat
        setMessages(prevMessages => [...prevMessages, data[0]]);

        // Scroll to the bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        // Fallback: Fetch all messages again immediately
        console.log('No message data returned, refreshing all messages');
        try {
          const { data: messagesData, error: messagesError } = await supabase
            .rpc('get_messages_with_profiles', {
              p_group_id: group.id,
              p_user_id: userId,
              p_limit: 100
            });

          if (messagesError) {
            console.error('Error fetching messages:', messagesError);
          } else {
            setMessages(messagesData || []);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    // Remove the chat parameter from the URL
    const url = new URL(window.location.href);
    url.searchParams.delete("chat");
    router.push(url.toString());
  };

  // No longer needed as we redirect non-members

  if (loading) {
    return (
      <div className="fixed z-20 flex top-0 md:top-[69px] left-0 right-0 bottom-0 border-t border-border md:border-t">
        <div className="container mx-auto flex px-0 sm:px-0 md:px-4">
          <div className="hidden md:block w-80 h-[calc(100vh-69px)]">
            <Card className="h-full border-r border-b-0 border-t-0 border-l-0 rounded-none shadow-none">
              <CardHeader className="px-4 py-3 border-b">
                <div className="h-8 w-40 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-10 w-full bg-muted animate-pulse rounded mt-2"></div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card className="relative flex-1 border-none shadow-none px-0 sm:px-0 md:px-0 overflow-hidden flex flex-col pb-16 md:pb-4 h-screen md:h-[calc(100vh-69px)]">
            <CardHeader className="bg-background border-b px-3 sm:px-4 md:px-6">
              <div className="flex justify-between items-start">
                <div className="h-8 w-64 bg-muted animate-pulse rounded"></div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 z-10"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Loading chat messages...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed z-20 flex top-0 md:top-[69px] left-0 right-0 bottom-0 border-t border-border md:border-t">
      <div className="container mx-auto flex px-0 sm:px-0 md:px-4">
        <div className="hidden md:block w-80 h-[calc(100vh-69px)]">
          <MinimalGroupChatSidebar
            currentGroupId={group.id}
            groupName={group.name}
            groupImage={group.image_url}
          />
        </div>
        <Card className="relative flex-1 border-none shadow-none px-0 sm:px-0 md:px-0 overflow-hidden flex flex-col pb-16 md:pb-4 h-screen md:h-[calc(100vh-69px)]">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 z-10"
        onClick={handleClose}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardHeader className="pb-2 bg-background border-b flex items-center px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 mb-2 pr-8 w-full"> {/* Added right padding for X button */}
          <Button variant="ghost" size="sm" className="rounded-full mr-2 p-0 h-8 w-8" onClick={handleClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{group.name}</h1>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="mt-1">
                <MessageSquare className="h-3 w-3 mr-1" />
                Chat
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="mb-2">
          {messages.length} messages
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto border-none rounded-none p-1 sm:p-2 md:p-4 bg-background">
          {messages.length > 0 ? (
            <div className="space-y-3 pt-3">
              <AnimatePresence initial={false}>
                {[...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`flex gap-2 ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                    >
                  {message.sender_id !== userId && (
                    <Avatar className="h-8 w-8">
                      {message.avatar_url ? (
                        <AvatarImage src={message.avatar_url} />
                      ) : (
                        <AvatarFallback>
                          <Users className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] ${message.sender_id === userId
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm shadow-sm'
                      : 'bg-muted rounded-2xl rounded-bl-sm shadow-sm'} p-2 sm:p-3`}>
                    <div className="flex justify-between items-center gap-4 mb-1">
                      <span className="text-xs font-medium">
                        {message.sender_id === userId
                          ? 'You'
                          : message.full_name || message.username || 'Unknown User'}
                      </span>
                      <span className="text-[10px] opacity-70 whitespace-nowrap">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                  {message.sender_id === userId && (
                    <Avatar className="h-8 w-8">
                      {userProfile?.avatar_url ? (
                        <AvatarImage src={userProfile.avatar_url} />
                      ) : (
                        <AvatarFallback>
                          <Users className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6 pt-12"
            >
              <div className="bg-muted/30 p-8 rounded-full mb-4">
                <MessageSquare className="h-12 w-12 opacity-30 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">No messages yet</h3>
              <p className="text-sm max-w-xs">Be the first to send a message in this group chat!</p>
            </motion.div>
          )}
        </div>

        <div className="sticky bottom-0 bg-background p-2 sm:p-3 md:p-4">
          <div className="flex gap-2 items-center mx-auto max-w-3xl">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              className="rounded-full bg-muted/50 focus-visible:ring-primary/50"
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              size="icon"
              className="rounded-full h-10 w-10 aspect-square flex items-center justify-center p-0"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>


        </Card>
      </div>
    </div>
  );
}

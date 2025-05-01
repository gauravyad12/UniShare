"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { formatDistanceToNow } from "date-fns";
import MinimalGroupChatSidebar from "./minimal-group-chat-sidebar";
import ResourceThumbnail from "./resource-thumbnail";
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
  ArrowLeft,
  X,
  Loader2,
  Menu,
  ArrowUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useToast } from "./ui/use-toast";
import { TypingUsers } from "@/types/chat";
import "@/types/supabase-typing-status";
import ShareGroupResource from "./share-group-resource";

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUsers>({});
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const [cleanupFunction, setCleanupFunction] = useState<(() => void) | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingCooldownRef = useRef<NodeJS.Timeout | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Detect mobile devices and keyboard visibility
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const hasTouchCapability = 'ontouchstart' in window ||
                                navigator.maxTouchPoints > 0 ||
                                (navigator as any).msMaxTouchPoints > 0;

      // Consider mobile if width is small OR device has touch capability
      const mobileDevice = width < 768 || hasTouchCapability;
      setIsMobile(mobileDevice);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile);

    // Only apply keyboard detection on mobile
    if (isMobile) {
      // For Chrome's VirtualKeyboard API (Chromium browsers)
      if ('virtualKeyboard' in navigator) {
        const virtualKeyboard = (navigator as any).virtualKeyboard;
        virtualKeyboard.overlaysContent = true;

        // Listen for keyboard visibility changes
        virtualKeyboard.addEventListener('geometrychange', () => {
          setIsKeyboardVisible(virtualKeyboard.boundingRect.height > 0);
        });
      }
      // For Safari and other browsers, use visual viewport API
      else if ('visualViewport' in window) {
        const viewport = window.visualViewport;

        // Function to handle viewport resize
        const handleViewportResize = () => {
          // Calculate the difference between window height and visual viewport height
          // This difference is approximately the keyboard height
          const keyboardHeight = window.innerHeight - viewport!.height;
          setIsKeyboardVisible(keyboardHeight > 150); // Threshold to detect keyboard

          // Directly hide the navbar when keyboard is visible
          if (keyboardHeight > 150) {
            const bottomNavbar = document.querySelector('[class*="fixed bottom-0 left-0 right-0 z-50"]');
            if (bottomNavbar) {
              (bottomNavbar as HTMLElement).style.transform = 'translateY(120%)';
              (bottomNavbar as HTMLElement).style.transition = 'transform 0.3s ease';
            }

            // Also hide any action buttons that might be above the navbar
            const actionButton = document.querySelector('.rounded-full.shadow-md.h-14.w-14.bg-primary.-mt-6');
            if (actionButton) {
              (actionButton as HTMLElement).style.opacity = '0';
              (actionButton as HTMLElement).style.transition = 'opacity 0.3s ease';
            }

            // Adjust the chat container to reclaim the space
            const chatContainer = document.querySelector('.chat-container');
            if (chatContainer) {
              (chatContainer as HTMLElement).style.paddingBottom = '0';
              (chatContainer as HTMLElement).style.marginBottom = '0';
              (chatContainer as HTMLElement).style.bottom = '0';
              (chatContainer as HTMLElement).style.transition = 'all 0.3s ease';
            }

            // Also adjust the card content
            const cardContent = document.querySelector('.chat-container .flex-1.overflow-hidden.flex.flex-col');
            if (cardContent) {
              (cardContent as HTMLElement).style.paddingBottom = '0';
            }

            // Make the input container more compact
            const inputContainer = document.querySelector('.chat-container .sticky.bottom-0');
            if (inputContainer) {
              (inputContainer as HTMLElement).style.marginBottom = '0';
              (inputContainer as HTMLElement).style.paddingBottom = '0';
            }
          }
        };

        // Add event listeners for visual viewport changes
        viewport?.addEventListener('resize', handleViewportResize);
        viewport?.addEventListener('scroll', handleViewportResize);

        // Cleanup function for viewport listeners
        return () => {
          viewport?.removeEventListener('resize', handleViewportResize);
          viewport?.removeEventListener('scroll', handleViewportResize);
          window.removeEventListener("resize", checkMobile);
        };
      }
    }

    // Cleanup for non-mobile case
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, [isMobile]);

  // Add direct event listeners to chat input
  useEffect(() => {
    if (isMobile) {
      // Find all chat inputs
      const chatInputs = document.querySelectorAll('.simple-group-chat-input');

      const handleFocus = () => {
        // Only hide navbar if we're on a real mobile device with a virtual keyboard
        if ('visualViewport' in window) {
          // Check after a delay if the keyboard is visible
          setTimeout(() => {
            const currentHeight = window.visualViewport?.height || window.innerHeight;
            const keyboardHeight = window.innerHeight - currentHeight;

            // Only hide navbar if keyboard is actually visible
            if (keyboardHeight > 150) {
              // Hide navbar when chat input is focused
              const bottomNavbar = document.querySelector('[class*="fixed bottom-0 left-0 right-0 z-50"]');
              if (bottomNavbar) {
                (bottomNavbar as HTMLElement).style.transform = 'translateY(120%)';
                (bottomNavbar as HTMLElement).style.transition = 'transform 0.3s ease';
              }

              // Also hide any action buttons that might be above the navbar
              const actionButton = document.querySelector('.rounded-full.shadow-md.h-14.w-14.bg-primary.-mt-6');
              if (actionButton) {
                (actionButton as HTMLElement).style.opacity = '0';
                (actionButton as HTMLElement).style.transition = 'opacity 0.3s ease';
              }

              // Adjust the chat container to reclaim the space
              const chatContainer = document.querySelector('.chat-container');
              if (chatContainer) {
                (chatContainer as HTMLElement).style.paddingBottom = '0';
                (chatContainer as HTMLElement).style.marginBottom = '0';
                (chatContainer as HTMLElement).style.bottom = '0';
                (chatContainer as HTMLElement).style.transition = 'all 0.3s ease';
              }

              // Also adjust the card content
              const cardContent = document.querySelector('.chat-container .flex-1.overflow-hidden.flex.flex-col');
              if (cardContent) {
                (cardContent as HTMLElement).style.paddingBottom = '0';
              }

              // Make the input container more compact
              const inputContainer = document.querySelector('.chat-container .sticky.bottom-0');
              if (inputContainer) {
                (inputContainer as HTMLElement).style.marginBottom = '0';
                (inputContainer as HTMLElement).style.paddingBottom = '0';
              }

              // Adjust the New Messages button position
              const newMessagesButton = document.querySelector('.new-messages-button');
              if (newMessagesButton) {
                // Use a fixed pixel value for more precise positioning
                (newMessagesButton.parentElement as HTMLElement).style.bottom = '80px';
              }
            }
          }, 300); // Wait for keyboard to appear
        }
      };

      // Add focus listeners to all chat inputs
      chatInputs.forEach(input => {
        input.addEventListener('focus', handleFocus);
      });

      // Cleanup
      return () => {
        chatInputs.forEach(input => {
          input.removeEventListener('focus', handleFocus);
        });
      };
    }
  }, [isMobile]);

  // Simple keyboard detection for button positioning
  useEffect(() => {
    if (!isMobile || !('visualViewport' in window)) return;

    const viewport = window.visualViewport;

    const handleViewportChange = () => {
      const keyboardHeight = window.innerHeight - (viewport?.height || window.innerHeight);
      const isKeyboardShown = keyboardHeight > 150;

      // Update isKeyboardVisible state
      setIsKeyboardVisible(isKeyboardShown);

      if (isKeyboardShown) {
        console.log('Keyboard visible - button will be positioned at 5rem from bottom');
      } else {
        console.log('Keyboard hidden - button will be positioned at 8rem from bottom');
      }
    };

    viewport?.addEventListener('resize', handleViewportChange);
    viewport?.addEventListener('scroll', handleViewportChange);

    // Initial check
    handleViewportChange();

    // Cleanup
    return () => {
      viewport?.removeEventListener('resize', handleViewportChange);
      viewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, [isMobile]);

  // Component state initialized

  // Update typing status in the database
  const updateTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!userId || !group.id) return;

    console.log('Updating typing status:', isTyping);

    try {
      const supabase = createClient();

      // Use the security definer function to upsert typing status
      const { data: success, error: upsertError } = await supabase
        .rpc('upsert_typing_status', {
          p_group_id: group.id,
          p_user_id: userId,
          p_is_typing: isTyping
        });

      if (upsertError) {
        console.error('Error updating typing status:', upsertError);
        return;
      }

      if (!success) {
        console.log('Failed to update typing status - user may not be a member of this group');
        return;
      }

      // Clear typing status after 5 seconds of inactivity
      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          updateTypingStatus(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [userId, group.id]);

  // Clear typing status
  const clearTypingStatus = useCallback(async () => {
    if (!userId || !group.id) return;

    console.log('Clearing typing status');

    try {
      const supabase = createClient();

      // Use the security definer function to delete typing status
      const { error: deleteError } = await supabase
        .rpc('delete_typing_status', {
          p_group_id: group.id,
          p_user_id: userId
        });

      if (deleteError) {
        console.error('Error clearing typing status:', deleteError);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('Error clearing typing status:', error);
    }
  }, [userId, group.id]);

  // Check if user is scrolled to the bottom
  const checkIfScrolledToBottom = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;

    // Calculate how far from the bottom we are
    const scrolledFromBottom = scrollHeight - scrollTop - clientHeight;

    // Use a consistent threshold for simplicity
    const threshold = 200;

    const isAtBottomNow = scrolledFromBottom < threshold;

    // Simple state updates without delays or double-checks
    if (!isAtBottomNow && !isButtonVisible) {
      setIsButtonVisible(true);
    }
    else if (isAtBottomNow && isButtonVisible) {
      setIsButtonVisible(false);
    }

    // Update at-bottom state
    if (isAtBottomNow !== isAtBottom) {
      setIsAtBottom(isAtBottomNow);
    }
  }, [isAtBottom, isButtonVisible]);


  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      // First try smooth scrolling
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });

      // Then force scroll with a single timeout to ensure it works
      // This is more reliable and less likely to cause glitches
      const timeout = setTimeout(() => {
        if (messagesEndRef.current && messagesContainerRef.current) {
          // Force scroll with auto behavior as a fallback
          messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });

          // Also try direct scrollTop setting as another fallback
          const container = messagesContainerRef.current;
          container.scrollTop = container.scrollHeight;

          // Update state
          setIsAtBottom(true);
        }
      }, 300);

      // Return cleanup function
      return () => clearTimeout(timeout);
    }
  }, []);

  // Initial scroll to bottom when messages change
  const initialLoadRef = useRef(true);

  useEffect(() => {
    // Check scroll position immediately
    checkIfScrolledToBottom();

    const checkTimeout = setTimeout(() => {
      // Only auto-scroll on initial load or when user is already at the bottom
      if (initialLoadRef.current || isAtBottom) {
        scrollToBottom();
        // Mark initial load as complete after first scroll
        initialLoadRef.current = false;
      }
    }, 100);

    return () => clearTimeout(checkTimeout);
  }, [messages, isAtBottom, scrollToBottom, checkIfScrolledToBottom]);

  // Also check scroll position on component mount
  useEffect(() => {
    // Check scroll position multiple times after mounting to ensure it's correct
    const timeouts = [500, 1000, 2000, 3000].map(delay => {
      return setTimeout(() => {
        checkIfScrolledToBottom();
      }, delay);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [checkIfScrolledToBottom]);

  // Set up scroll event listener with a delay to ensure ref is initialized
  useEffect(() => {
    // Use a timeout to ensure the ref is initialized
    const setupTimeout = setTimeout(() => {
      const container = messagesContainerRef.current;
      if (!container) return;

      // Check initial scroll position
      checkIfScrolledToBottom();

      // Add scroll event listener
      const scrollHandler = () => {
        // Use RAF to avoid too many updates
        requestAnimationFrame(() => {
          checkIfScrolledToBottom();
        });
      };

      // Force check scroll position every second to ensure button appears
      const intervalId = setInterval(() => {
        checkIfScrolledToBottom();
      }, 1000);

      container.addEventListener('scroll', scrollHandler);

      // Also check on resize
      window.addEventListener('resize', scrollHandler);

      // Store cleanup function
      const cleanup = () => {
        if (container) {
          container.removeEventListener('scroll', scrollHandler);
        }
        window.removeEventListener('resize', scrollHandler);
        clearInterval(intervalId);
      };

      // Store the cleanup function for later use
      setCleanupFunction(() => cleanup);
    }, 500); // 500ms delay to ensure DOM is fully rendered

    return () => {
      clearTimeout(setupTimeout);
      // Call the stored cleanup function if it exists
      cleanupFunction && cleanupFunction();
    };
  }, [checkIfScrolledToBottom, cleanupFunction]);

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

        // Get typing status using the security definer function
        const { data: typingData, error: typingError } = await supabase
          .rpc('get_typing_status_for_group', {
            p_group_id: group.id,
            p_user_id: userId
          });

        if (typingError) {
          console.error('Error polling typing status:', typingError);
        } else if (typingData && Array.isArray(typingData)) {
          console.log('Typing status data:', typingData);

          // Process typing status updates
          const now = new Date();
          const activeTypingUsers: TypingUsers = {};

          for (const status of typingData) {
            if (status.is_typing) {
              // Check if the typing status is recent (within last 10 seconds)
              const updatedAt = new Date(status.updated_at);
              const timeDiff = now.getTime() - updatedAt.getTime();

              if (timeDiff < 10000) { // 10 seconds
                // Fetch user profile if not already in typing users
                if (!typingUsers[status.user_id]) {
                  const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('full_name, username, avatar_url')
                    .eq('id', status.user_id)
                    .single();

                  if (profile) {
                    activeTypingUsers[status.user_id] = {
                      full_name: profile.full_name,
                      username: profile.username,
                      avatar_url: profile.avatar_url,
                      updated_at: status.updated_at
                    };
                  }
                } else {
                  // Keep existing profile info, just update timestamp
                  activeTypingUsers[status.user_id] = {
                    ...typingUsers[status.user_id],
                    updated_at: status.updated_at
                  };
                }
              }
            }
          }

          // Update typing users state
          setTypingUsers(activeTypingUsers);
        } else {
          // Clear typing users if no data is returned
          setTypingUsers({});
        }
      } catch (error) {
        console.error('Error in message polling:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [group.id, userId, messages.length, typingUsers]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Set initial button visibility to false
        setIsButtonVisible(false);
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

        if (isCreator) {
        } else {
          // Use the stored procedure to check membership
          try {
            const { data: membershipData } = await supabase
              .rpc('check_study_group_membership', {
                p_group_id: group.id,
                p_user_id: user.id
              });

            const isUserMember = membershipData && membershipData.length > 0 && membershipData[0].is_member;

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

            // Mark as initial load so the useEffect will scroll to bottom
            initialLoadRef.current = true;
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

            // Immediately remove typing indicator for the sender
            // This makes the chat feel more responsive when receiving messages
            const senderId = payload.new.sender_id;
            if (senderId) {
              setTypingUsers(prev => {
                const updated = {...prev};
                if (updated[senderId]) {
                  delete updated[senderId];
                }
                return updated;
              });
            }

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
                // Scroll to bottom after adding the new message
                setTimeout(() => scrollToBottom(), 200);
              } else if (messagesData) {
                console.log('Refreshed messages with profiles');
                setMessages(messagesData);
                // Scroll to bottom after refreshing messages
                setTimeout(() => scrollToBottom(), 200);
              }
            } catch (error) {
              console.error('Error fetching messages:', error);
              // Fallback if the API fails
              setMessages(prevMessages => [...prevMessages, payload.new]);
              // Scroll to bottom after adding the new message
              setTimeout(() => scrollToBottom(), 200);
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

    // Cleanup subscription and typing status on unmount
    return () => {
      if (subscription) {
        const supabase = createClient();
        supabase.removeChannel(subscription);
      }

      // Clear typing status when component unmounts
      if (userId && group.id) {
        // Use the security definer function to avoid dependency issues
        const supabase = createClient();
        supabase
          .rpc('delete_typing_status', {
            p_group_id: group.id,
            p_user_id: userId
          })
          .then(() => console.log('Typing status cleared on unmount'))
          .catch((err: Error) => console.error('Error clearing typing status on unmount:', err));
      }

      // Clear any pending timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Clear any cooldown timeouts
      if (typingCooldownRef.current) {
        clearTimeout(typingCooldownRef.current);
        typingCooldownRef.current = null;
      }
    };
  }, [group.id, userId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    try {
      setSending(true);
      const supabase = createClient();

      // Immediately hide the current user's typing indicator client-side
      // This makes the UI feel more responsive
      setTypingUsers(prev => {
        const updated = {...prev};
        if (userId && updated[userId]) {
          delete updated[userId];
        }
        return updated;
      });

      // Clear typing status when sending a message
      await clearTypingStatus();

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

      // Set a cooldown period to prevent the typing indicator from immediately reappearing
      // This makes the chat feel more natural
      if (typingCooldownRef.current) {
        clearTimeout(typingCooldownRef.current);
      }

      typingCooldownRef.current = setTimeout(() => {
        typingCooldownRef.current = null;
      }, 2000); // 2 second cooldown

      // The function returns the message with profile information
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('Message sent with profile:', data[0]);

        // Add the message to the chat
        setMessages(prevMessages => [...prevMessages, data[0]]);

        // Always scroll to the bottom when sending a message
        // Use a slightly longer timeout to ensure the message is rendered
        setTimeout(() => {
          scrollToBottom();
        }, 200);
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
            // Scroll to bottom after refreshing messages
            setTimeout(() => scrollToBottom(), 200);
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

  const toggleMobileSidebar = () => {
    setShowMobileSidebar(prev => !prev);
  };

  // No longer needed as we redirect non-members

  if (loading) {
    return (
      <div className="fixed z-20 flex top-0 md:top-[69px] left-0 right-0 bottom-0 border-t border-border md:border-t chat-container">
        <div className="container mx-auto flex px-0 sm:px-0 md:px-4">
          <div className="hidden md:block w-80 h-[calc(100vh-69px)]">
            <Card className="h-full border-r border-b-0 border-t-0 border-l-0 rounded-none shadow-none">
              <CardHeader className="px-4 py-3 border-b">
                <div className="h-8 w-40 bg-muted rounded mb-2"></div>
                <div className="h-10 w-full bg-muted rounded mt-2"></div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card className="relative flex-1 border-none shadow-none px-0 sm:px-0 md:px-0 overflow-hidden flex flex-col pb-16 md:pb-4 h-screen md:h-[calc(100vh-69px)]">
            <CardHeader className="bg-background border-b px-3 sm:px-4 md:px-6">
              <div className="flex items-center gap-2 mb-2 pr-8 w-full">
                <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                  <Menu className="h-4 w-4 text-muted-foreground/50" />
                </div>
                <div className="flex-1">
                  <div className="h-6 w-48 bg-muted rounded mb-2"></div>
                  <div className="h-4 w-16 bg-muted rounded"></div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 z-10"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-4 w-32 bg-muted rounded"></div>
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
    <div className="fixed z-20 flex top-0 md:top-[69px] left-0 right-0 bottom-0 border-t border-border md:border-t chat-container">
      <div className="w-full mx-auto flex px-0 md:container md:px-4">
        {/* Desktop sidebar - always visible */}
        <div className="hidden md:block w-80 h-[calc(100vh-69px)]">
          <MinimalGroupChatSidebar
            currentGroupId={group.id}
            groupName={group.name}
            groupImage={group.image_url}
            onChatSelect={toggleMobileSidebar}
          />
        </div>

        {/* Mobile sidebar with animation - conditionally visible */}
        <AnimatePresence>
          {showMobileSidebar && (
            <>
              {/* Backdrop overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
                onClick={toggleMobileSidebar}
              />

              {/* Sidebar */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed top-0 left-0 bottom-0 w-full z-40 md:hidden bg-background shadow-lg"
              >
                <div className="h-full relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 z-50"
                    onClick={toggleMobileSidebar}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <MinimalGroupChatSidebar
                    currentGroupId={group.id}
                    groupName={group.name}
                    groupImage={group.image_url}
                    onChatSelect={toggleMobileSidebar}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <Card className={`relative flex-1 border-none shadow-none px-0 sm:px-0 md:px-0 overflow-hidden flex flex-col ${isMobile && isKeyboardVisible ? 'pb-0' : 'pb-20'} md:pb-4 h-screen md:h-[calc(100vh-69px)] transition-all duration-200`}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 z-10"
        onClick={handleClose}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardHeader className="pb-2 bg-background border-b flex items-center px-0.5 sm:px-2 md:px-4">
        <div className="flex items-center gap-2 mb-2 pr-8 w-full"> {/* Added right padding for X button */}
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full mr-2 p-0 h-8 w-8 md:hidden flex items-center justify-center"
            onClick={toggleMobileSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full mr-2 p-0 h-8 w-8 hidden md:flex" onClick={handleClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate pr-4 max-w-full">{group.name}</h1>
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
        <div
          ref={messagesContainerRef}
          onScroll={() => checkIfScrolledToBottom()}
          className="flex-1 overflow-y-auto scrollbar-hide border-none rounded-none px-0.5 sm:px-2 md:px-4 py-2 bg-background relative"
        >
          {/* We'll move the button to the input container */}

          {messages.length > 0 ? (
            <div className="space-y-3 pt-3">
              <AnimatePresence initial={false}>
                {[...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div
                      className={`flex gap-2 ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                    >
                  {message.sender_id !== userId && (
                    <Avatar className="h-8 w-8">
                      {message.avatar_url ? (
                        <AvatarImage src={message.avatar_url} alt={message.full_name || message.username || "User"} />
                      ) : (
                        <AvatarFallback className="text-[10px]">
                          {message.full_name ? message.full_name.substring(0, 2).toUpperCase() :
                           message.username ? message.username.substring(0, 2).toUpperCase() : "UN"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[85%] ${message.sender_id === userId
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm shadow-sm'
                      : 'bg-muted rounded-2xl rounded-bl-sm shadow-sm'} p-2 sm:p-3 ${message.content.includes('[Resource:') ? 'min-w-[250px]' : ''}`}>
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
                    {message.content.includes('[Resource:') ? (
                      <>
                        {/* First render any text before the resource link */}
                        <p className="text-sm whitespace-pre-wrap break-words mb-1">
                          {message.content.split(/\[Resource:([^\]]*)\]\(([^\)]*)\)/)[0]}
                        </p>

                        {/* Then render the resource link */}
                        {(() => {
                          const parts = message.content.split(/\[Resource:([^\]]*)\]\(([^\)]*)\)/);
                          if (parts.length >= 3) {
                            const title = parts[1].trim();
                            const link = parts[2];
                            const resourceId = link.split('view=')[1];

                            // Use ResourceThumbnail component to display the resource
                            return (
                              <div className="mt-4 mb-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 max-w-[280px] sm:max-w-[320px]">
                                <ResourceThumbnail
                                  resourceId={resourceId}
                                  title={title}
                                  link={link}
                                />
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Render any text after the resource link */}
                        {message.content.split(/\[Resource:([^\]]*)\]\(([^\)]*)\)/).length > 3 && (
                          <p className="text-sm whitespace-pre-wrap break-words mt-2">
                            {message.content.split(/\[Resource:([^\]]*)\]\(([^\)]*)\)/)[3]}
                          </p>
                        )}
                      </>
                    ) : (
                      // Regular message
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}
                  </div>
                  {message.sender_id === userId && (
                    <Avatar className="h-8 w-8">
                      {userProfile?.avatar_url ? (
                        <AvatarImage src={userProfile.avatar_url} alt={userProfile.full_name || userProfile.username || "You"} />
                      ) : (
                        <AvatarFallback className="text-[10px]">
                          {userProfile?.full_name ? userProfile.full_name.substring(0, 2).toUpperCase() :
                           userProfile?.username ? userProfile.username.substring(0, 2).toUpperCase() : "ME"}
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
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6 pt-12">
              <div className="bg-muted/30 p-8 rounded-full mb-4">
                <MessageSquare className="h-12 w-12 opacity-30 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">No messages yet</h3>
              <p className="text-sm max-w-xs">Be the first to send a message in this group chat!</p>
            </div>
          )}
        </div>

        {/* We'll move the button inside the input container */}

        <div className={`sticky bottom-0 bg-background px-0.5 sm:px-2 md:px-4 ${isMobile && isKeyboardVisible ? 'py-0 mb-0' : 'py-2'} w-full transition-all duration-200 relative`}>

          {/* We'll move the button to the flex container with the input and plus button */}

          {/* Typing indicator */}
          {Object.keys(typingUsers).length > 0 && (
            <div className={`flex items-center ${isMobile && isKeyboardVisible ? 'mb-0 text-xs' : 'mb-2 text-sm'} text-muted-foreground w-full md:max-w-3xl transition-all duration-200`}>
              <span>
                {Object.keys(typingUsers).length === 1
                  ? `${Object.values(typingUsers)[0].full_name || Object.values(typingUsers)[0].username || 'Someone'} is typing`
                  : `${Object.keys(typingUsers).length} people are typing`}
              </span>
              <span className="ml-1 flex">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </span>
            </div>
          )}
          <div className={`flex ${isMobile && isKeyboardVisible ? 'gap-1' : 'gap-2'} items-center w-full md:mx-auto md:max-w-3xl transition-all duration-200 relative`}>
            {/* New Messages button - centered relative to the input and plus button */}
            <div className="absolute left-0 right-0 top-0 flex justify-center z-[100] pointer-events-none" style={{ transform: 'translateY(-100%)', marginTop: '-1rem' }}>
              <AnimatePresence>
                {!isAtBottom && isButtonVisible && messages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-full shadow-lg bg-background border border-border text-foreground hover:bg-background/90 px-4 py-2 pointer-events-auto"
                      onClick={() => {
                        // Hide the button with animation before scrolling
                        setIsButtonVisible(false);
                        // Then scroll to bottom after a short delay
                        setTimeout(scrollToBottom, 100);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                      New Messages
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ShareGroupResource
              groupId={group.id}
              onResourceSelected={(resourceId, resourceTitle) => {
                // Create a message with a link to the resource
                const resourceLink = `[Resource: ${resourceTitle}](/dashboard/resources?view=${resourceId})`;
                setNewMessage(prev => prev ? `${prev} ${resourceLink}` : resourceLink);
              }}
            />
            <div className="relative flex-1">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                className={`rounded-full bg-muted/50 focus-visible:ring-primary/50 pr-10 w-full simple-group-chat-input ${isMobile && isKeyboardVisible ? 'h-8 py-1' : 'h-10 py-2'}`}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  // Only update typing status if we're not in a cooldown period
                  if (!typingCooldownRef.current) {
                    updateTypingStatus(true);
                  }
                }}
                onFocus={() => {
                  // Only hide navbar if we're on a real mobile device with a virtual keyboard
                  if (isMobile && 'visualViewport' in window) {
                    // Just check after a delay if the keyboard is visible

                    setTimeout(() => {
                      const currentHeight = window.visualViewport?.height || window.innerHeight;
                      const keyboardHeight = window.innerHeight - currentHeight;

                      // Only hide navbar if keyboard is actually visible
                      if (keyboardHeight > 150) {
                        const bottomNavbar = document.querySelector('[class*="fixed bottom-0 left-0 right-0 z-50"]');
                        if (bottomNavbar) {
                          (bottomNavbar as HTMLElement).style.transform = 'translateY(120%)';
                          (bottomNavbar as HTMLElement).style.transition = 'transform 0.3s ease';
                        }

                        // Also hide any action buttons that might be above the navbar
                        const actionButton = document.querySelector('.rounded-full.shadow-md.h-14.w-14.bg-primary.-mt-6');
                        if (actionButton) {
                          (actionButton as HTMLElement).style.opacity = '0';
                          (actionButton as HTMLElement).style.transition = 'opacity 0.3s ease';
                        }
                      }
                    }, 300); // Wait for keyboard to appear
                  }
                }}
                onBlur={() => {
                  // Only restore the navbar if we're not still in the keyboard state
                  if (isMobile && !isKeyboardVisible) {
                    setTimeout(() => {
                      const bottomNavbar = document.querySelector('[class*="fixed bottom-0 left-0 right-0 z-50"]');
                      if (bottomNavbar) {
                        (bottomNavbar as HTMLElement).style.transform = 'translateY(0)';
                      }

                      // Show action buttons again
                      const actionButton = document.querySelector('.rounded-full.shadow-md.h-14.w-14.bg-primary.-mt-6');
                      if (actionButton) {
                        (actionButton as HTMLElement).style.opacity = '1';
                      }
                    }, 300); // Small delay to ensure we don't restore too early
                  }
                }}
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
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-6 w-6 flex items-center justify-center p-0 bg-transparent hover:bg-muted/80"
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <ArrowUp className="h-3.5 w-3.5 text-primary" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>


        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

export default function KeyboardAwareLayout() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on mobile
    const checkMobile = () => {
      const width = window.innerWidth;
      const hasTouchCapability = 'ontouchstart' in window ||
                                navigator.maxTouchPoints > 0 ||
                                (navigator as any).msMaxTouchPoints > 0;

      // Consider mobile if width is small OR device has touch capability
      const isMobileView = width < 768 || hasTouchCapability; // md breakpoint in Tailwind
      setIsMobile(isMobileView);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile);

    // Only apply keyboard fixes on mobile
    if (isMobile) {
      // Chrome's VirtualKeyboard API (Chromium browsers)
      if ('virtualKeyboard' in navigator) {
        (navigator as any).virtualKeyboard.overlaysContent = true;
      }
      // For Safari and other browsers, use visual viewport API
      else if ('visualViewport' in window) {
        const viewport = window.visualViewport;

        // Function to handle viewport resize
        const handleViewportResize = () => {
          // Get the bottom navbar element
          const bottomNavbar = document.querySelector('[class*="fixed bottom-0 left-0 right-0 z-50"]');

          if (bottomNavbar) {
            // Calculate the difference between window height and visual viewport height
            // This difference is approximately the keyboard height
            const keyboardHeight = window.innerHeight - viewport!.height;

            // Check if any input is focused
            const isInputFocused = document.activeElement instanceof HTMLInputElement ||
                                  document.activeElement instanceof HTMLTextAreaElement;

            // Check specifically for chat input
            const isChatInputFocused = isInputFocused &&
                                      ((document.activeElement as HTMLElement).classList.contains('simple-group-chat-input') ||
                                       (document.activeElement instanceof HTMLInputElement &&
                                        document.activeElement.placeholder &&
                                        document.activeElement.placeholder.includes("Type your message")));

            // Force hide navbar if chat input is focused, regardless of keyboard height
            if (isChatInputFocused) {
              console.log("Chat input is focused - forcing navbar to hide");
              (bottomNavbar as HTMLElement).style.transform = 'translateY(120%)';
              (bottomNavbar as HTMLElement).style.transition = 'transform 0.1s ease';

              // Also hide any action buttons that might be above the navbar
              const actionButton = document.querySelector('.rounded-full.shadow-md.h-14.w-14.bg-primary.-mt-6');
              if (actionButton) {
                (actionButton as HTMLElement).style.opacity = '0';
                (actionButton as HTMLElement).style.transition = 'opacity 0.1s ease';
              }

              // Adjust the chat container to reclaim the space
              const chatContainer = document.querySelector('.chat-container');
              if (chatContainer) {
                (chatContainer as HTMLElement).style.paddingBottom = '0';
                (chatContainer as HTMLElement).style.transition = 'padding-bottom 0.1s ease';
              }
              return;
            }

            if (keyboardHeight > 150) { // Threshold to detect keyboard
              // When keyboard is visible, hide the navbar with extra offset for the plus button
              (bottomNavbar as HTMLElement).style.transform = 'translateY(120%)'; // Increased from 100% to 120%
              (bottomNavbar as HTMLElement).style.transition = 'transform 0.1s ease';

              // Also hide any action buttons that might be above the navbar
              const actionButton = document.querySelector('.rounded-full.shadow-md.h-14.w-14.bg-primary.-mt-6');
              if (actionButton) {
                (actionButton as HTMLElement).style.opacity = '0';
                (actionButton as HTMLElement).style.transition = 'opacity 0.1s ease';
              }

              // Adjust the chat container to reclaim the space
              const chatContainer = document.querySelector('.chat-container');
              if (chatContainer) {
                (chatContainer as HTMLElement).style.paddingBottom = '0';
                (chatContainer as HTMLElement).style.marginBottom = '0';
                (chatContainer as HTMLElement).style.bottom = '0';
                (chatContainer as HTMLElement).style.transition = 'all 0.1s ease';
              }

              // Also adjust the card content
              const cardContent = document.querySelector('.chat-container .flex-1.overflow-hidden.flex.flex-col');
              if (cardContent) {
                (cardContent as HTMLElement).style.paddingBottom = '0';
              }
            } else if (!isInputFocused) {
              // Only show navbar when keyboard is hidden AND no input is focused
              (bottomNavbar as HTMLElement).style.transform = 'translateY(0)';

              // Show action buttons again
              const actionButton = document.querySelector('.rounded-full.shadow-md.h-14.w-14.bg-primary.-mt-6');
              if (actionButton) {
                (actionButton as HTMLElement).style.opacity = '1';
              }

              // Restore chat container padding
              const chatContainer = document.querySelector('.chat-container');
              if (chatContainer) {
                (chatContainer as HTMLElement).style.paddingBottom = '';
                (chatContainer as HTMLElement).style.marginBottom = '';
                (chatContainer as HTMLElement).style.bottom = '';
              }

              // Restore card content padding
              const cardContent = document.querySelector('.chat-container .flex-1.overflow-hidden.flex.flex-col');
              if (cardContent) {
                (cardContent as HTMLElement).style.paddingBottom = '';
              }
            }
          }
        };

        // Add event listeners for visual viewport changes
        viewport?.addEventListener('resize', handleViewportResize);
        viewport?.addEventListener('scroll', handleViewportResize);

        // Add event listeners for input focus/blur
        const handleInputFocus = () => {
          // Only check after a delay if the keyboard is visible
          setTimeout(() => {
            const keyboardHeight = window.innerHeight - (window.visualViewport?.height || 0);

            // Only hide navbar if keyboard is actually visible
            if (keyboardHeight > 150) {
              const bottomNavbar = document.querySelector('[class*="fixed bottom-0 left-0 right-0 z-50"]');
              if (bottomNavbar) {
                (bottomNavbar as HTMLElement).style.transform = 'translateY(120%)';
                (bottomNavbar as HTMLElement).style.transition = 'transform 0.1s ease';
              }

              // Also hide any action buttons that might be above the navbar
              const actionButton = document.querySelector('.rounded-full.shadow-md.h-14.w-14.bg-primary.-mt-6');
              if (actionButton) {
                (actionButton as HTMLElement).style.opacity = '0';
                (actionButton as HTMLElement).style.transition = 'opacity 0.1s ease';
              }
            }
          }, 50);
        };

        const handleInputBlur = () => {
          // Show navbar when input loses focus
          const bottomNavbar = document.querySelector('[class*="fixed bottom-0 left-0 right-0 z-50"]');
          if (bottomNavbar) {
            (bottomNavbar as HTMLElement).style.transform = 'translateY(0)';
          }

          // Show action buttons again
          const actionButton = document.querySelector('.rounded-full.shadow-md.h-14.w-14.bg-primary.-mt-6');
          if (actionButton) {
            (actionButton as HTMLElement).style.opacity = '1';
          }
        };

        // Add event listeners to all input fields and textareas
        document.addEventListener('focusin', (e) => {
          if (e.target instanceof HTMLInputElement ||
              e.target instanceof HTMLTextAreaElement) {
            // Always handle focus for chat inputs
            if ((e.target as HTMLElement).closest('.simple-group-chat-input') ||
                (e.target.placeholder && e.target.placeholder.includes("Type your message"))) {
              console.log("Chat input focused - hiding navbar");
              handleInputFocus();
            } else {
              handleInputFocus();
            }
          }
        });

        document.addEventListener('focusout', (e) => {
          if (e.target instanceof HTMLInputElement ||
              e.target instanceof HTMLTextAreaElement) {
            handleInputBlur();
          }
        });

        // Cleanup function
        return () => {
          viewport?.removeEventListener('resize', handleViewportResize);
          viewport?.removeEventListener('scroll', handleViewportResize);
          document.removeEventListener('focusin', handleInputFocus);
          document.removeEventListener('focusout', handleInputBlur);
          window.removeEventListener("resize", checkMobile);
        };
      }
    }

    // Cleanup for non-mobile case
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, [isMobile]);

  // This component doesn't render anything visible
  return null;
}

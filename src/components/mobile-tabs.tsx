"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileTabsProps {
  tabs: {
    value: string;
    label: string;
    href?: string; // Make href optional
  }[];
  activeTab: string;
  className?: string;
  onTabChange?: (value: string) => void; // Add callback for tab changes
}

export default function MobileTabs({ tabs, activeTab, className, onTabChange }: MobileTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if scrolling arrows should be shown
  const checkScrollArrows = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer
  };

  // Scroll to active tab on mount and when activeTab changes
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    // Find the active tab element
    const activeElement = scrollContainerRef.current.querySelector(`[data-value="${activeTab}"]`) as HTMLElement;
    if (activeElement) {
      // Scroll the active tab into view with a small delay to ensure DOM is ready
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const containerWidth = scrollContainerRef.current.clientWidth;
          const tabLeft = activeElement.offsetLeft;
          const tabWidth = activeElement.offsetWidth;

          // Center the active tab
          scrollContainerRef.current.scrollLeft = tabLeft - (containerWidth / 2) + (tabWidth / 2);

          // Check if arrows should be shown
          checkScrollArrows();
        }
      }, 100);
    }
  }, [activeTab]);

  // Check if we're on mobile and add scroll event listener
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint in Tailwind
      checkScrollArrows();
    };

    // Initial check
    checkMobile();

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScrollArrows);
      window.addEventListener('resize', checkMobile);

      return () => {
        scrollContainer.removeEventListener('scroll', checkScrollArrows);
        window.removeEventListener('resize', checkMobile);
      };
    }
  }, []);

  // Handle scroll buttons
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: -100, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: 100, behavior: 'smooth' });
  };

  // Reset loading state when active tab changes
  useEffect(() => {
    setIsLoading(false);
  }, [activeTab]);

  // Handle tab click with callback
  const handleTabClick = (e: React.MouseEvent<HTMLButtonElement>, tabValue: string) => {
    e.preventDefault();
    if (onTabChange && tabValue !== activeTab) {
      setIsLoading(true);
      onTabChange(tabValue);

      // Add a safety timeout to reset loading state after 3 seconds
      // in case the navigation doesn't complete for some reason
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Left scroll button - only show on mobile */}
      {isMobile && showLeftArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
          onClick={scrollLeft}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Tabs container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide py-2 px-2 relative scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className={cn("flex space-x-1", isMobile ? "mx-auto" : "")}>
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={(e) => handleTabClick(e, tab.value)}
              data-value={tab.value}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative",
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground shadow-sm after:absolute after:bottom-[-8px] after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {isLoading && activeTab === tab.value ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  {tab.label}
                </span>
              ) : (
                tab.label
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right scroll button - only show on mobile */}
      {isMobile && showRightArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
          onClick={scrollRight}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* We've moved the active tab indicator directly into the button */}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Meeting {
  id: string;
  title: string;
  group_name: string;
  start_time: string;
  end_time: string;
  is_past?: boolean;
}

interface MeetingCarouselProps {
  meetings: Meeting[];
  isPast?: boolean;
}

export default function MeetingCarousel({ meetings, isPast = false }: MeetingCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleMeetings, setVisibleMeetings] = useState<Meeting[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate how many meetings to show at once (2 by default)
  const meetingsPerPage = 2;
  const totalPages = Math.ceil(meetings.length / meetingsPerPage);

  useEffect(() => {
    // Update visible meetings when active index changes
    const startIdx = activeIndex * meetingsPerPage;
    const endIdx = Math.min(startIdx + meetingsPerPage, meetings.length);
    setVisibleMeetings(meetings.slice(startIdx, endIdx));
  }, [activeIndex, meetings]);

  const goToPage = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium flex items-center">
          <Calendar className={cn("h-4 w-4 mr-2", isPast ? "text-muted-foreground" : "text-primary")} />
          {isPast ? "Past Meetings" : "Upcoming Meetings"}
        </h3>
        {meetings.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {meetings.length} total
          </div>
        )}
      </div>

      <div className="relative" ref={containerRef}>
        <div className="space-y-3">
          {visibleMeetings.map((meeting) => {
            const startDate = new Date(meeting.start_time);
            const endDate = new Date(meeting.end_time);
            return (
              <div
                key={meeting.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border",
                  isPast && "border-muted bg-muted/30"
                )}
              >
                <div className="flex-1">
                  <h4 className="font-medium">{meeting.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {meeting.group_name}
                  </p>
                  <div className={cn("flex items-center mt-2 text-sm", isPast && "text-muted-foreground")}>
                    <span>
                      {startDate.toLocaleDateString()} •{" "}
                      {startDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {endDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dot pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 gap-1.5">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  activeIndex === index 
                    ? isPast 
                      ? "bg-muted-foreground" 
                      : "bg-primary" 
                    : "bg-muted-foreground/30"
                )}
                onClick={() => goToPage(index)}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

interface Meeting {
  id: string;
  title: string;
  group_name: string;
  start_time: string;
  end_time: string;
  is_past?: boolean;
}

interface MobileMeetingsSectionProps {
  upcomingMeetings: Meeting[];
  pastMeetings: Meeting[];
}

export default function MobileMeetingsSection({
  upcomingMeetings,
  pastMeetings,
}: MobileMeetingsSectionProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const meetings = activeTab === 'upcoming' ? upcomingMeetings : pastMeetings;
  const hasMeetings = meetings.length > 0;

  return (
    <div className="bg-background rounded-xl shadow-sm border border-border/50 overflow-hidden mb-6">
      <div className="p-4 border-b border-border/50">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Study Sessions
          </h3>
          <Link href="/dashboard/study-groups" className="text-xs text-primary flex items-center">
            View All
            <ChevronRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-2 text-sm font-medium text-center relative ${
            activeTab === 'upcoming' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          Upcoming
          {activeTab === 'upcoming' && (
            <motion.div
              layoutId="tabIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              initial={false}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`flex-1 py-2 text-sm font-medium text-center relative ${
            activeTab === 'past' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          Past
          {activeTab === 'past' && (
            <motion.div
              layoutId="tabIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              initial={false}
            />
          )}
        </button>
      </div>

      {/* Meeting list */}
      <div className="p-4">
        {hasMeetings ? (
          <div className="space-y-4">
            {meetings.slice(0, 3).map((meeting) => (
              <div
                key={meeting.id}
                className="flex gap-3 p-3 rounded-lg border border-border/50 bg-background"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-md bg-primary/10 flex flex-col items-center justify-center text-primary">
                  <span className="text-xs font-medium">
                    {formatDate(meeting.start_time).split(' ')[0]}
                  </span>
                  <span className="text-lg font-bold">
                    {new Date(meeting.start_time).getDate()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{meeting.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{meeting.group_name}</p>
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {meetings.length > 3 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/study-groups">
                    View {meetings.length - 3} more
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-muted-foreground text-sm mb-4">
              {activeTab === 'upcoming'
                ? "You don't have any upcoming study sessions"
                : "You don't have any past study sessions"}
            </p>
            <Button size="sm" asChild>
              <Link href="/dashboard/study-groups">
                Find Study Groups
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Link as LinkIcon, ExternalLink, MoreVertical, Trash2, Clock4, Loader2 } from "lucide-react";
import { format, isPast, isToday, addDays } from "date-fns";
import { Badge } from "./ui/badge";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UpdateMeetingTime from "./update-meeting-time";

interface GroupMeetingsListProps {
  groupId: string;
  refreshTrigger?: number;
}

export default function GroupMeetingsList({
  groupId,
  refreshTrigger = 0,
}: GroupMeetingsListProps) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);
  const [updateMeetingId, setUpdateMeetingId] = useState<string | null>(null);
  const [updateMeetingData, setUpdateMeetingData] = useState<{startTime: string, endTime: string} | null>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      setLoading(true);
      const supabase = createClient();

      // Get current user
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error("Error getting user:", error);
      }

      try {
        // Use the raw SQL function to bypass RLS policies
        const { data: rawResult, error: sqlError } = await supabase
          .rpc('fetch_study_sessions_raw', {
            p_group_id: groupId
          });

        if (sqlError) {
          console.error("Error executing SQL function:", sqlError);
          return;
        }

        console.log('Raw SQL result received');

        // Parse the JSON result
        let meetingsData = [];
        try {
          if (rawResult) {
            meetingsData = JSON.parse(rawResult);
            console.log(`Parsed ${meetingsData.length} meetings from SQL result`);
          } else {
            console.log('No meetings found (null result)');
          }
        } catch (parseError) {
          console.error("Error parsing SQL result:", parseError);
          console.log("Raw result:", rawResult);
          return;
        }

        setMeetings(meetingsData || []);
        console.log('Meetings set:', meetingsData);
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [groupId, refreshTrigger]);

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!userId) return;

    try {
      setDeletingMeetingId(meetingId);

      // Call the API to delete the meeting
      const response = await fetch('/api/study-groups/delete-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete the meeting');
      }

      console.log("Meeting deleted successfully");

      // Update the meetings list
      setMeetings(meetings.filter(meeting => meeting.id !== meetingId));

    } catch (error) {
      console.error("Error deleting meeting:", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setDeletingMeetingId(null);
    }
  };

  const handleOpenUpdateTime = (meeting: any) => {
    setUpdateMeetingId(meeting.id);
    setUpdateMeetingData({
      startTime: meeting.start_time,
      endTime: meeting.end_time
    });
  };

  const getMeetingStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isPast(end)) {
      return { label: "Past", variant: "outline" as const };
    }

    if (now >= start && now <= end) {
      return { label: "In Progress", variant: "default" as const };
    }

    if (isToday(start) || (start <= addDays(now, 1) && start.getDate() === addDays(now, 1).getDate())) {
      return { label: "Upcoming", variant: "secondary" as const };
    }

    return { label: "Scheduled", variant: "outline" as const };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-20">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No meetings scheduled yet.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {meetings.map((meeting) => {
          const startDate = new Date(meeting.start_time);
          const endDate = new Date(meeting.end_time);
          const status = getMeetingStatus(meeting.start_time, meeting.end_time);

          return (
            <div
              key={meeting.id}
              className="border rounded-md p-4 hover:bg-muted/30 transition-colors"
            >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium truncate max-w-[70%]">{meeting.title}</h3>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <Badge variant={status.variant} className="text-xs whitespace-nowrap">{status.label}</Badge>
                {userId === meeting.created_by && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                        <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleOpenUpdateTime(meeting)}
                      >
                        <Clock4 className="mr-2 h-4 w-4" />
                        Change Time
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        {deletingMeetingId === meeting.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Meeting
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {meeting.description && (
              <p className="text-sm text-muted-foreground mb-3">{meeting.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  {format(startDate, "MMM d, yyyy")}
                  {format(startDate, "yyyy-MM-dd") !== format(endDate, "yyyy-MM-dd") &&
                    ` - ${format(endDate, "MMM d, yyyy")}`}
                </span>
              </div>

              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                </span>
              </div>

              {meeting.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{meeting.location}</span>
                </div>
              )}

              {meeting.meeting_link && (
                <div className="flex items-center">
                  <LinkIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Button variant="link" size="sm" className="h-auto p-0 text-left" asChild>
                    <Link href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                      <span className="line-clamp-1">Join Meeting</span> <ExternalLink className="h-3 w-3 ml-1 inline-flex" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              Scheduled by {meeting.creator_full_name || meeting.creator_username || "Unknown"}
            </div>
          </div>
        );
      })}
      </div>

      {updateMeetingId && updateMeetingData && (
        <UpdateMeetingTime
          meetingId={updateMeetingId}
          currentStartTime={updateMeetingData.startTime}
          currentEndTime={updateMeetingData.endTime}
          onUpdate={() => {
            // Refresh the meetings list
            const fetchMeetings = async () => {
              setLoading(true);
              const supabase = createClient();

              try {
                // Use the raw SQL function to bypass RLS policies
                const { data: rawResult, error: sqlError } = await supabase
                  .rpc('fetch_study_sessions_raw', {
                    p_group_id: groupId
                  });

                if (sqlError) {
                  console.error("Error executing SQL function:", sqlError);
                  return;
                }

                // Parse the JSON result
                let meetingsData = [];
                try {
                  if (rawResult) {
                    meetingsData = JSON.parse(rawResult);
                  }
                } catch (parseError) {
                  console.error("Error parsing SQL result:", parseError);
                  return;
                }

                setMeetings(meetingsData || []);
              } catch (error) {
                console.error("Unexpected error:", error);
              } finally {
                setLoading(false);
              }
            };

            fetchMeetings();
          }}
          open={!!updateMeetingId}
          onOpenChange={(open) => {
            if (!open) {
              setUpdateMeetingId(null);
              setUpdateMeetingData(null);
            }
          }}
        />
      )}
    </>
  );
}

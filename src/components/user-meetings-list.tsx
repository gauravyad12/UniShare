"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Link as LinkIcon, ExternalLink, Loader2 } from "lucide-react";
import { format, isPast, isToday, addDays } from "date-fns";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardTitle } from "./ui/card";

export default function UserMeetingsList() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      setLoading(true);
      const supabase = createClient();
      
      // Get current user
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        } else {
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error getting user:", error);
        setLoading(false);
        return;
      }

      try {
        // Fetch all study sessions for groups the user is a member of
        const { data: rawResult, error: sqlError } = await supabase
          .rpc('get_user_study_sessions');

        if (sqlError) {
          console.error("Error executing SQL function:", sqlError);
          setLoading(false);
          return;
        }

        console.log('Raw SQL result received for user meetings');
        
        // Parse the JSON result if needed
        let meetingsData = rawResult || [];
        console.log(`Found ${meetingsData.length} meetings for user`);
        
        setMeetings(meetingsData);
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

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

  // Filter meetings into upcoming and past
  const upcomingMeetings = meetings.filter(meeting => {
    const end = new Date(meeting.end_time);
    return !isPast(end);
  }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const pastMeetings = meetings.filter(meeting => {
    const end = new Date(meeting.end_time);
    return isPast(end);
  }).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()); // Sort past meetings in reverse chronological order

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading your meetings...</p>
        </div>
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <Card className="bg-muted/40">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
          <Calendar className="h-12 w-12 text-muted-foreground" />
          <CardTitle>No Meetings Found</CardTitle>
          <CardDescription>
            You don't have any scheduled study group meetings yet.
          </CardDescription>
          <Button className="mt-2" asChild>
            <Link href="/dashboard/study-groups">
              Browse Study Groups
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const renderMeeting = (meeting: any) => {
    const startDate = new Date(meeting.start_time);
    const endDate = new Date(meeting.end_time);
    const status = getMeetingStatus(meeting.start_time, meeting.end_time);
    
    return (
      <div
        key={meeting.id}
        className="border rounded-md p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
            <h3 className="font-medium truncate max-w-[90%]">{meeting.title}</h3>
            <Link 
              href={`/dashboard/study-groups?view=${meeting.study_group_id}`}
              className="text-xs text-muted-foreground hover:underline"
            >
              {meeting.group_name}
            </Link>
          </div>
          <Badge variant={status.variant} className="text-xs whitespace-nowrap">{status.label}</Badge>
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

          {meeting.meeting_link && !isPast(endDate) && (
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
  };

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="upcoming">
          Upcoming ({upcomingMeetings.length})
        </TabsTrigger>
        <TabsTrigger value="past">
          Past ({pastMeetings.length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="upcoming" className="space-y-4">
        {upcomingMeetings.length > 0 ? (
          <div className="space-y-4">
            {upcomingMeetings.map(renderMeeting)}
          </div>
        ) : (
          <Card className="bg-muted/40">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <CardTitle>No Upcoming Meetings</CardTitle>
              <CardDescription>
                You don't have any upcoming study group meetings scheduled.
              </CardDescription>
              <Button className="mt-2" asChild>
                <Link href="/dashboard/study-groups">
                  Browse Study Groups
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </TabsContent>
      
      <TabsContent value="past" className="space-y-4">
        {pastMeetings.length > 0 ? (
          <div className="space-y-4">
            {pastMeetings.map(renderMeeting)}
          </div>
        ) : (
          <Card className="bg-muted/40">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <CardTitle>No Past Meetings</CardTitle>
              <CardDescription>
                You don't have any past study group meetings.
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Calendar, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";
import MeetingCarousel from "./meeting-carousel";

export default function UserMeetingsCarousel() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get both upcoming and past meetings using the custom function
        const { data: allMeetings, error: meetingsError } = await supabase
          .rpc('get_user_meetings');

        if (meetingsError) {
          console.error("Error fetching meetings:", meetingsError);
          setLoading(false);
          return;
        }

        // Split meetings into upcoming and past
        const upcomingMeetings = allMeetings?.filter(meeting => !meeting.is_past) || [];
        const pastMeetings = allMeetings?.filter(meeting => meeting.is_past) || [];

        // Sort upcoming meetings by start time (ascending)
        upcomingMeetings.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        // Sort past meetings by start time (descending - most recent first)
        pastMeetings.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

        // Get all upcoming meetings for display
        const limitedUpcomingMeetings = upcomingMeetings;
        // Limit past meetings to only the 4 most recent ones
        const limitedPastMeetings = pastMeetings.slice(0, 4);

        // Combine both types of meetings
        setMeetings([...limitedUpcomingMeetings, ...limitedPastMeetings]);
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Split meetings into upcoming and past
  const upcomingMeetings = meetings.filter(meeting => !meeting.is_past);
  const pastMeetings = meetings.filter(meeting => meeting.is_past);

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

  return (
    <div className="space-y-6">
      {/* Upcoming Meetings Section */}
      {upcomingMeetings.length > 0 && (
        <MeetingCarousel meetings={upcomingMeetings} isPast={false} />
      )}

      {/* Past Meetings Section */}
      {pastMeetings.length > 0 && (
        <MeetingCarousel meetings={pastMeetings} isPast={true} />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, MapPin, Link as LinkIcon, Plus, Loader2 } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { format } from "date-fns";

interface ScheduleGroupMeetingProps {
  groupId: string;
  onMeetingScheduled?: () => void;
}

export default function ScheduleGroupMeeting({
  groupId,
  onMeetingScheduled,
}: ScheduleGroupMeetingProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const handleScheduleMeeting = async () => {
    // Validate inputs
    if (!title) {
      toast({
        title: "Missing title",
        description: "Please enter a title for the meeting",
        variant: "destructive",
      });
      return;
    }

    if (!startDate || !startTime) {
      toast({
        title: "Missing start time",
        description: "Please enter a start date and time",
        variant: "destructive",
      });
      return;
    }

    if (!endDate || !endTime) {
      toast({
        title: "Missing end time",
        description: "Please enter an end date and time",
        variant: "destructive",
      });
      return;
    }

    // Convert dates and times to ISO strings
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    // Validate dates
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      toast({
        title: "Invalid date/time",
        description: "Please enter valid dates and times",
        variant: "destructive",
      });
      return;
    }

    if (startDateTime >= endDateTime) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    setScheduling(true);
    const supabase = createClient();

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to schedule meetings",
          variant: "destructive",
        });
        return;
      }

      // Use the API endpoint to schedule the meeting
      const response = await fetch('/api/study-groups/schedule-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          title,
          description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          location,
          isOnline: !!meetingLink,
          meetingLink
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error scheduling meeting:", data.error);
        toast({
          title: "Error",
          description: data.error || "Failed to schedule the meeting",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Meeting scheduled",
          description: "The meeting has been scheduled successfully",
        });

        // Call the callback if provided
        if (onMeetingScheduled) {
          onMeetingScheduled();
        }

        // Close the dialog and reset form
        setOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setScheduling(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setLocation("");
    setMeetingLink("");
  };

  // Set default times when the dialog opens
  const setDefaultTimes = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Format dates for input fields
    const dateStr = format(now, "yyyy-MM-dd");
    const startTimeStr = format(oneHourLater, "HH:mm");
    const endTimeStr = format(twoHoursLater, "HH:mm");

    setStartDate(dateStr);
    setEndDate(dateStr);
    setStartTime(startTimeStr);
    setEndTime(endTimeStr);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (newOpen) {
          setDefaultTimes();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule a Meeting</DialogTitle>
          <DialogDescription>
            Create a new meeting for this study group.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="meeting-title">Title</Label>
            <Input
              id="meeting-title"
              placeholder="Meeting title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meeting-description">Description (optional)</Label>
            <Textarea
              id="meeting-description"
              placeholder="What's this meeting about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start-date"
                  type="date"
                  className="pl-8"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start-time">Start Time</Label>
              <div className="relative">
                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start-time"
                  type="time"
                  className="pl-8"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="end-date"
                  type="date"
                  className="pl-8"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-time">End Time</Label>
              <div className="relative">
                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="end-time"
                  type="time"
                  className="pl-8"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">Location (optional)</Label>
            <div className="relative">
              <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="e.g. Library, Room 101"
                className="pl-8"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meeting-link">Meeting Link (optional)</Label>
            <div className="relative">
              <LinkIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="meeting-link"
                placeholder="e.g. Zoom or Google Meet link"
                className="pl-8"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleScheduleMeeting}
            disabled={scheduling}
          >
            {scheduling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>Schedule Meeting</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

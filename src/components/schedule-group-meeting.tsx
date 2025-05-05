"use client";

import { useState, useEffect } from "react";
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
import { Calendar, Clock, MapPin, Link as LinkIcon, Plus, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import MobileDateTimePicker from "./mobile-date-time-picker";

interface ScheduleGroupMeetingProps {
  groupId: string;
  onMeetingScheduled?: () => void;
}

// Character limits for each field
const charLimits = {
  title: 25,
  description: 100,
  location: 100,
  meetingLink: 255
};

export default function ScheduleGroupMeeting({
  groupId,
  onMeetingScheduled,
}: ScheduleGroupMeetingProps) {
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
  const [isMobile, setIsMobile] = useState(false);

  // For mobile date time picker
  const [startDateTime, setStartDateTime] = useState(new Date());
  const [endDateTime, setEndDateTime] = useState(new Date());

  // Character counts
  const [charCounts, setCharCounts] = useState({
    title: 0,
    description: 0,
    location: 0,
    meetingLink: 0
  });

  const handleScheduleMeeting = async () => {
    // Validate inputs
    if (!title) {
      console.error("Missing title: Please enter a title for the meeting");
      return;
    }

    if (title.length > charLimits.title) {
      console.error(`Title too long: Title must be ${charLimits.title} characters or less`);
      return;
    }

    if (description && description.length > charLimits.description) {
      console.error(`Description too long: Description must be ${charLimits.description} characters or less`);
      return;
    }

    if (!startDate || !startTime) {
      console.error("Missing start time: Please enter a start date and time");
      return;
    }

    if (!endDate || !endTime) {
      console.error("Missing end time: Please enter an end date and time");
      return;
    }

    // Get date/time values based on device type
    let startDateTimeValue: Date;
    let endDateTimeValue: Date;

    if (isMobile) {
      // Use the date objects directly from the mobile picker
      startDateTimeValue = startDateTime;
      endDateTimeValue = endDateTime;
    } else {
      // Convert dates and times to ISO strings for desktop inputs
      startDateTimeValue = new Date(`${startDate}T${startTime}`);
      endDateTimeValue = new Date(`${endDate}T${endTime}`);
    }

    // Validate dates
    if (isNaN(startDateTimeValue.getTime()) || isNaN(endDateTimeValue.getTime())) {
      console.error("Invalid date/time: Please enter valid dates and times");
      return;
    }

    if (startDateTimeValue >= endDateTimeValue) {
      console.error("Invalid time range: End time must be after start time");
      return;
    }

    setScheduling(true);
    const supabase = createClient();

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error("Error: You must be logged in to schedule meetings");
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
          startTime: startDateTimeValue.toISOString(),
          endTime: endDateTimeValue.toISOString(),
          location,
          isOnline: !!meetingLink,
          meetingLink
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error scheduling meeting:", data.error || "Failed to schedule the meeting");
      } else {
        console.log("Meeting scheduled successfully");

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

    // Reset character counts
    setCharCounts({
      title: 0,
      description: 0,
      location: 0,
      meetingLink: 0
    });
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

    // Set date objects for mobile pickers
    setStartDateTime(oneHourLater);
    setEndDateTime(twoHoursLater);
  };

  // Detect mobile devices
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

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Update character counts when values change
  useEffect(() => {
    setCharCounts({
      title: title.length,
      description: description.length,
      location: location.length,
      meetingLink: meetingLink.length
    });
  }, [title, description, location, meetingLink]);

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (newOpen) {
          setDefaultTimes();
        }
      }}
      modal={true}
      className="schedule-meeting-dialog"
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </DialogTrigger>
      <DialogContent
        className={`${isMobile ? 'w-full h-[100dvh] max-h-[100dvh] p-0 rounded-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95' : 'sm:max-w-[500px]'}`}
        style={isMobile ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: 'none',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        } : {}}
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent auto-focus on open
      >
        {isMobile && (
          <button
            className="absolute right-4 top-4 z-20 rounded-full p-2 opacity-70 transition-opacity hover:opacity-100 w-8 h-8 flex items-center justify-center"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className={`${isMobile ? 'h-14 bg-background' : 'hidden'}`}></div>
        <DialogHeader className={`${isMobile ? 'sticky top-0 z-10 bg-background border-b px-4 py-4' : ''}`}>
          <DialogTitle>Schedule a Meeting</DialogTitle>
          <DialogDescription>
            Create a new meeting for this study group.
          </DialogDescription>
        </DialogHeader>
        <div className={`space-y-4 py-4 ${isMobile ? 'px-4 overflow-y-auto flex-1 pb-4' : ''}`}>
          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label htmlFor="meeting-title">Title</Label>
              <span className="text-xs text-muted-foreground">
                {charCounts.title}/{charLimits.title}
              </span>
            </div>
            <Input
              id="meeting-title"
              placeholder="Brief meeting title"
              value={title}
              onChange={(e) => {
                const newValue = e.target.value;
                if (newValue.length <= charLimits.title) {
                  setTitle(newValue);
                  setCharCounts(prev => ({ ...prev, title: newValue.length }));
                }
              }}
              maxLength={charLimits.title}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label htmlFor="meeting-description">Description (optional)</Label>
              <span className="text-xs text-muted-foreground">
                {charCounts.description}/{charLimits.description}
              </span>
            </div>
            <Textarea
              id="meeting-description"
              placeholder="Brief description of the meeting (100 chars max)"
              value={description}
              onChange={(e) => {
                const newValue = e.target.value;
                if (newValue.length <= charLimits.description) {
                  setDescription(newValue);
                  setCharCounts(prev => ({ ...prev, description: newValue.length }));
                }
              }}
              maxLength={charLimits.description}
              rows={2}
            />
          </div>

          {/* Date/time selector - different for mobile and desktop */}
          <div className="space-y-4">
            {isMobile ? (
              // Mobile custom date/time picker
              <>
                <MobileDateTimePicker
                  label="Start Date & Time"
                  value={startDateTime}
                  onChange={(date) => setStartDateTime(date)}
                  icon="calendar"
                />

                <MobileDateTimePicker
                  label="End Date & Time"
                  value={endDateTime}
                  onChange={(date) => setEndDateTime(date)}
                  icon="clock"
                />
              </>
            ) : (
              // Desktop standard date/time inputs
              <>
                <div className="grid gap-2">
                  <Label htmlFor="start-datetime">Start Date & Time</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="start-date"
                        type="date"
                        className="pl-8 w-full"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="relative flex-1">
                      <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="start-time"
                        type="time"
                        className="pl-8 w-full"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="end-datetime">End Date & Time</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="end-date"
                        type="date"
                        className="pl-8 w-full"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <div className="relative flex-1">
                      <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="end-time"
                        type="time"
                        className="pl-8 w-full"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label htmlFor="location">Location (optional)</Label>
              <span className="text-xs text-muted-foreground">
                {charCounts.location}/{charLimits.location}
              </span>
            </div>
            <div className="relative">
              <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="e.g. Library, Room 101"
                className="pl-8"
                value={location}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (newValue.length <= charLimits.location) {
                    setLocation(newValue);
                    setCharCounts(prev => ({ ...prev, location: newValue.length }));
                  }
                }}
                maxLength={charLimits.location}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label htmlFor="meeting-link">Meeting Link (optional)</Label>
              <span className="text-xs text-muted-foreground">
                {charCounts.meetingLink}/{charLimits.meetingLink}
              </span>
            </div>
            <div className="relative">
              <LinkIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="meeting-link"
                placeholder="e.g. Zoom or Google Meet link"
                className="pl-8"
                value={meetingLink}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (newValue.length <= charLimits.meetingLink) {
                    setMeetingLink(newValue);
                    setCharCounts(prev => ({ ...prev, meetingLink: newValue.length }));
                  }
                }}
                maxLength={charLimits.meetingLink}
              />
            </div>
          </div>
        </div>
        <DialogFooter className={`flex-col sm:flex-row gap-2 sm:gap-0 ${isMobile ? 'fixed bottom-0 left-0 right-0 bg-background py-3 border-t px-4 z-50 shadow-md' : ''}`}>
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

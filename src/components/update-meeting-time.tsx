"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Loader2 } from "lucide-react";
import MobileDateTimePicker from "./mobile-date-time-picker";

interface UpdateMeetingTimeProps {
  meetingId: string;
  currentStartTime: string;
  currentEndTime: string;
  onUpdate: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UpdateMeetingTime({
  meetingId,
  currentStartTime,
  currentEndTime,
  onUpdate,
  open,
  onOpenChange,
}: UpdateMeetingTimeProps) {
  const [startDate, setStartDate] = useState(format(new Date(currentStartTime), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(format(new Date(currentStartTime), "HH:mm"));
  const [endDate, setEndDate] = useState(format(new Date(currentEndTime), "yyyy-MM-dd"));
  const [endTime, setEndTime] = useState(format(new Date(currentEndTime), "HH:mm"));
  const [updating, setUpdating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // For mobile date time picker
  const [startDateTime, setStartDateTime] = useState(new Date(currentStartTime));
  const [endDateTime, setEndDateTime] = useState(new Date(currentEndTime));

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

  const handleUpdateTime = async () => {
    // Validate inputs
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

    setUpdating(true);

    try {
      // Call the API to update the meeting time
      const response = await fetch('/api/study-groups/update-meeting-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId,
          startTime: startDateTimeValue.toISOString(),
          endTime: endDateTimeValue.toISOString(),
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update meeting time');
      }

      console.log("Success: Meeting time updated successfully");

      // Call the callback to refresh the meetings list
      onUpdate();

      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating meeting time:", error instanceof Error ? error.message : "Failed to update meeting time");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent auto-focus on open
      >
        <DialogHeader>
          <DialogTitle>Update Meeting Time</DialogTitle>
          <DialogDescription>
            Change the start and end time for this meeting.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateTime}
            disabled={updating}
          >
            {updating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>Update Time</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

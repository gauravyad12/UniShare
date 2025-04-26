"use client";

import { useState } from "react";
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
import { useToast } from "./ui/use-toast";

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
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(format(new Date(currentStartTime), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(format(new Date(currentStartTime), "HH:mm"));
  const [endDate, setEndDate] = useState(format(new Date(currentEndTime), "yyyy-MM-dd"));
  const [endTime, setEndTime] = useState(format(new Date(currentEndTime), "HH:mm"));
  const [updating, setUpdating] = useState(false);

  const handleUpdateTime = async () => {
    // Validate inputs
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
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update meeting time');
      }

      toast({
        title: "Success",
        description: "Meeting time updated successfully",
      });

      // Call the callback to refresh the meetings list
      onUpdate();

      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating meeting time:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update meeting time",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Meeting Time</DialogTitle>
          <DialogDescription>
            Change the start and end time for this meeting.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Mobile-friendly date/time selector */}
          <div className="space-y-4">
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

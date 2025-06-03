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
  DialogScrollableContent
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, MapPin, Link as LinkIcon, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";

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

  // Character counts
  const [charCounts, setCharCounts] = useState({
    title: 0,
    description: 0,
    location: 0,
    meetingLink: 0
  });

  // Form errors
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    description?: string;
    location?: string;
    meetingLink?: string;
    dateTime?: string;
  }>({});

  const handleScheduleMeeting = async () => {
    // Clear previous errors
    setFormErrors({});
    let hasErrors = false;
    const errors: { [key: string]: string } = {};

    // Validate inputs
    if (!title) {
      errors.title = "Title is required";
      hasErrors = true;
    }

    if (title.length > charLimits.title) {
      errors.title = `Title must be ${charLimits.title} characters or less`;
      hasErrors = true;
    }

    if (description && description.length > charLimits.description) {
      errors.description = `Description must be ${charLimits.description} characters or less`;
      hasErrors = true;
    }

    if (!startDate || !startTime) {
      errors.dateTime = "Start date and time are required";
      hasErrors = true;
    }

    if (!endDate || !endTime) {
      errors.dateTime = "End date and time are required";
      hasErrors = true;
    }

    // Check for bad words
    const { containsBadWords } = await import('@/utils/badWords');

    // Check title for bad words
    if (title && await containsBadWords(title)) {
      errors.title = "Title contains inappropriate language";
      hasErrors = true;
    }

    // Check description for bad words
    if (description && await containsBadWords(description)) {
      errors.description = "Description contains inappropriate language";
      hasErrors = true;
    }

    // Check location for bad words
    if (location && await containsBadWords(location)) {
      errors.location = "Location contains inappropriate language";
      hasErrors = true;
    }

    // Check meeting link for bad words
    if (meetingLink && await containsBadWords(meetingLink)) {
      errors.meetingLink = "Meeting link contains inappropriate language";
      hasErrors = true;
    }

    if (hasErrors) {
      setFormErrors(errors);
      return;
    }

    // Convert dates and times to ISO strings
    const startDateTimeValue = new Date(`${startDate}T${startTime}`);
    const endDateTimeValue = new Date(`${endDate}T${endTime}`);

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

    // Reset form errors
    setFormErrors({});
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
        } else {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Schedule a Meeting</DialogTitle>
          <DialogDescription>
            Create a new meeting for this study group.
          </DialogDescription>
        </DialogHeader>
        <DialogScrollableContent>
          <div className="space-y-4">
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
                onChange={async (e) => {
                  const newValue = e.target.value;
                  if (newValue.length <= charLimits.title) {
                    setTitle(newValue);

                    // Check for bad words when value changes
                    if (newValue.trim()) {
                      const { containsBadWords } = await import('@/utils/badWords');
                      const hasBadWords = await containsBadWords(newValue);

                      if (hasBadWords) {
                        setFormErrors(prev => ({
                          ...prev,
                          title: "Title contains inappropriate language"
                        }));
                      } else {
                        // Clear error if no bad words
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.title;
                          return newErrors;
                        });
                      }
                    } else {
                      // Clear error if field is empty
                      setFormErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.title;
                        return newErrors;
                      });
                    }
                  }
                }}
                maxLength={charLimits.title}
                className={formErrors.title ? "border-red-500" : ""}
              />
              {formErrors.title && (
                <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>
              )}
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
                placeholder="Brief description of the meeting"
                value={description}
                onChange={async (e) => {
                  const newValue = e.target.value;
                  if (newValue.length <= charLimits.description) {
                    setDescription(newValue);

                    // Check for bad words when value changes
                    if (newValue.trim()) {
                      const { containsBadWords } = await import('@/utils/badWords');
                      const hasBadWords = await containsBadWords(newValue);

                      if (hasBadWords) {
                        setFormErrors(prev => ({
                          ...prev,
                          description: "Description contains inappropriate language"
                        }));
                      } else {
                        // Clear error if no bad words
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.description;
                          return newErrors;
                        });
                      }
                    } else {
                      // Clear error if field is empty
                      setFormErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.description;
                        return newErrors;
                      });
                    }
                  }
                }}
                maxLength={charLimits.description}
                rows={2}
                className={formErrors.description ? "border-red-500" : ""}
              />
              {formErrors.description && (
                <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>
              )}
            </div>

            <div className="space-y-4">
              {formErrors.dateTime && (
                <p className="text-xs text-red-500">{formErrors.dateTime}</p>
              )}
              
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
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        // Clear date/time error when user selects a date
                        if (formErrors.dateTime) {
                          setFormErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.dateTime;
                            return newErrors;
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="relative flex-1">
                    <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="start-time"
                      type="time"
                      className="pl-8 w-full"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        // Clear date/time error when user selects a time
                        if (formErrors.dateTime) {
                          setFormErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.dateTime;
                            return newErrors;
                          });
                        }
                      }}
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
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        // Clear date/time error when user selects a date
                        if (formErrors.dateTime) {
                          setFormErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.dateTime;
                            return newErrors;
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="relative flex-1">
                    <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="end-time"
                      type="time"
                      className="pl-8 w-full"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        // Clear date/time error when user selects a time
                        if (formErrors.dateTime) {
                          setFormErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.dateTime;
                            return newErrors;
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
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
                  className={`pl-8 ${formErrors.location ? "border-red-500" : ""}`}
                  value={location}
                  onChange={async (e) => {
                    const newValue = e.target.value;
                    if (newValue.length <= charLimits.location) {
                      setLocation(newValue);

                      // Check for bad words when value changes
                      if (newValue.trim()) {
                        const { containsBadWords } = await import('@/utils/badWords');
                        const hasBadWords = await containsBadWords(newValue);

                        if (hasBadWords) {
                          setFormErrors(prev => ({
                            ...prev,
                            location: "Location contains inappropriate language"
                          }));
                        } else {
                          // Clear error if no bad words
                          setFormErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.location;
                            return newErrors;
                          });
                        }
                      } else {
                        // Clear error if field is empty
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.location;
                          return newErrors;
                        });
                      }
                    }
                  }}
                  maxLength={charLimits.location}
                />
                {formErrors.location && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.location}</p>
                )}
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
                  className={`pl-8 ${formErrors.meetingLink ? "border-red-500" : ""}`}
                  value={meetingLink}
                  onChange={async (e) => {
                    const newValue = e.target.value;
                    if (newValue.length <= charLimits.meetingLink) {
                      setMeetingLink(newValue);

                      // Check for bad words when value changes
                      if (newValue.trim()) {
                        const { containsBadWords } = await import('@/utils/badWords');
                        const hasBadWords = await containsBadWords(newValue);

                        if (hasBadWords) {
                          setFormErrors(prev => ({
                            ...prev,
                            meetingLink: "Meeting link contains inappropriate language"
                          }));
                        } else {
                          // Clear error if no bad words
                          setFormErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.meetingLink;
                            return newErrors;
                          });
                        }
                      } else {
                        // Clear error if field is empty
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.meetingLink;
                          return newErrors;
                        });
                      }
                    }
                  }}
                  maxLength={charLimits.meetingLink}
                />
                {formErrors.meetingLink && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.meetingLink}</p>
                )}
              </div>
            </div>
          </div>
        </DialogScrollableContent>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
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

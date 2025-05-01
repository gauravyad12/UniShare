"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Calendar, Clock } from "lucide-react";
import { format, addDays, setHours, setMinutes } from "date-fns";

interface MobileDateTimePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  icon?: "calendar" | "clock"; // Not used but kept for API compatibility
}

export default function MobileDateTimePicker({
  label,
  value,
  onChange
}: MobileDateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(value || new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Update internal state when value changes
  useEffect(() => {
    if (value) {
      setSelectedDate(value);
    }
  }, [value]);

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Close pickers when clicking outside
      if (showDatePicker || showTimePicker) {
        const target = e.target as HTMLElement;
        if (!target.closest('.date-time-picker-container')) {
          setShowDatePicker(false);
          setShowTimePicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker, showTimePicker]);

  // Format the display value
  const formattedDate = format(selectedDate, "EEE, MMM d, yyyy");
  const formattedTime = format(selectedDate, "h:mm a");

  // Handle time selection
  const handleTimeChange = (hours: number, minutes: number) => {
    const newDate = setMinutes(setHours(selectedDate, hours), minutes);
    setSelectedDate(newDate);
    onChange(newDate);
    setShowTimePicker(false);
  };

  // Generate time options
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        options.push({
          label: format(time, "h:mm a"),
          hour,
          minute
        });
      }
    }
    return options;
  };

  // Generate date options (today, tomorrow, next 5 days)
  const generateDateOptions = () => {
    const today = new Date();
    const options = [
      { label: "Today", date: today },
      { label: "Tomorrow", date: addDays(today, 1) }
    ];

    // Add next 5 days
    for (let i = 2; i < 7; i++) {
      const date = addDays(today, i);
      options.push({
        label: format(date, "EEE, MMM d"),
        date
      });
    }

    return options;
  };

  return (
    <div className="space-y-2 date-time-picker-container">
      <Label>{label}</Label>

      <div className="flex flex-col gap-2">
        {/* Date button */}
        <Button
          type="button"
          variant="outline"
          className="justify-start h-10 px-3 text-left"
          onClick={() => {
            setShowDatePicker(!showDatePicker);
            setShowTimePicker(false); // Close time picker when opening date picker
          }}
        >
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{formattedDate}</span>
        </Button>

        {/* Time button */}
        <Button
          type="button"
          variant="outline"
          className="justify-start h-10 px-3 text-left"
          onClick={() => {
            setShowTimePicker(!showTimePicker);
            setShowDatePicker(false); // Close date picker when opening time picker
          }}
        >
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{formattedTime}</span>
        </Button>
      </div>

      {/* Date picker dropdown */}
      {showDatePicker && (
        <div className="border rounded-md p-2 bg-background shadow-md space-y-1 mt-1 animate-in fade-in-0 zoom-in-95">
          {generateDateOptions().map((option, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                const newDate = new Date(option.date);
                newDate.setHours(
                  selectedDate.getHours(),
                  selectedDate.getMinutes(),
                  0,
                  0
                );
                setSelectedDate(newDate);
                onChange(newDate);
                setShowDatePicker(false);
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}

      {/* Time picker dropdown */}
      {showTimePicker && (
        <div className="border rounded-md p-2 bg-background shadow-md mt-1 animate-in fade-in-0 zoom-in-95 max-h-60 overflow-y-auto">
          <div className="grid grid-cols-2 gap-1">
            {generateTimeOptions().map((option, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                className="justify-center"
                onClick={() => {
                  handleTimeChange(option.hour, option.minute);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

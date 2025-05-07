"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Calendar, MoreHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import MobileDateTimePicker from "./mobile-date-time-picker";
import { Label } from "@/components/ui/label";

interface TodoFormProps {
  onAddTodo: (content: string, dueDate?: Date | null, priority?: string | null) => void;
}

export default function TodoForm({ onAddTodo }: TodoFormProps) {
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint in Tailwind
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      if (showOptions) {
        // Only apply options if they're visible
        const finalPriority = priority === "none" ? null : priority;
        onAddTodo(content, dueDate, finalPriority);
      } else {
        // Don't apply options if they're hidden
        onAddTodo(content, null, null);
      }
      setContent("");
      // Keep the date and priority settings for convenience
    }
  };

  const handleDateChange = (date: Date) => {
    setDueDate(date);
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Add a new task..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={toggleOptions}
          className={cn(
            "transition-colors",
            showOptions && "bg-accent text-accent-foreground"
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        <Button type="submit" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Speech bubble style options box */}
      {showOptions && (
        <div className="relative mt-2">
          {/* Triangle pointer */}
          <div
            className="absolute -top-2 w-4 h-4 bg-card border z-10"
            style={{
              right: 'calc(3.3rem + 9px)',
              transform: 'translateX(50%) rotate(45deg)',
              borderBottom: 'none',
              borderRight: 'none'
            }}
          />

          {/* Speech bubble content */}
          <div className="relative border rounded-md p-4 bg-card shadow-md z-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date picker - different for mobile and desktop */}
              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date</Label>
                {isMobile ? (
                  <MobileDateTimePicker
                    label=""
                    value={dueDate || new Date()}
                    onChange={handleDateChange}
                  />
                ) : (
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="date"
                      id="due-date"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          setDueDate(new Date(e.target.value));
                        } else {
                          setDueDate(null);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Priority selector */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority || undefined}
                  onValueChange={setPriority}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash, Edit, Check, X, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  todo: {
    id: string;
    content: string;
    is_completed: boolean;
    created_at: string;
    due_date?: string | null;
    priority?: "low" | "medium" | "high" | null;
  };
  onToggleComplete: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
}

export default function TodoItem({
  todo,
  onToggleComplete,
  onDelete,
  onUpdate,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(todo.content);

  const handleToggleComplete = () => {
    onToggleComplete(todo.id, !todo.is_completed);
  };

  const handleDelete = () => {
    onDelete(todo.id);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedContent.trim()) {
      onUpdate(todo.id, editedContent);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(todo.content);
    setIsEditing(false);
  };

  const getPriorityColor = (priority: string | null | undefined) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-2 p-3 rounded-lg border transition-colors",
      todo.is_completed ? "bg-muted/50 border-muted" : "bg-card border-border hover:border-primary/20"
    )}>
      <div className="flex items-center self-center">
        <Checkbox
          checked={todo.is_completed}
          onCheckedChange={handleToggleComplete}
          className="translate-y-[1px]"
        />
      </div>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button size="icon" variant="ghost" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col justify-center">
            <p className={cn(
              "text-sm break-words leading-normal py-0.5",
              todo.is_completed && "line-through text-muted-foreground"
            )}>
              {todo.content}
            </p>
            {(todo.due_date || todo.priority) && (
              <div className="flex flex-wrap gap-2 items-center mt-1">
                {todo.due_date && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(todo.due_date), "MMM d, yyyy")}
                  </div>
                )}
                {todo.priority && (
                  <Badge variant="outline" className={cn("text-xs", getPriorityColor(todo.priority))}>
                    {todo.priority}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {!isEditing && (
        <div className="flex gap-1 self-center">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleEdit}
            className="h-8 w-8"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDelete}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useToast, toast } from "@/lib/mobile-aware-toast";
import { CheckSquare, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface Todo {
  id: string;
  content: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  due_date?: string | null;
  priority?: "low" | "medium" | "high" | null;
}

export default function MobileTodoSection() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodoContent, setNewTodoContent] = useState("");
  const { toast } = useToast();

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/todos");

      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }

      const data = await response.json();
      setTodos(data.todos || []);
    } catch (error) {
      console.error("Error fetching todos:", error);
      toast({
        title: "Error",
        description: "Failed to load your to-do list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTodoContent.trim()) return;

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newTodoContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add todo");
      }

      const data = await response.json();
      setTodos([data.todo, ...todos]);
      setNewTodoContent("");
    } catch (error) {
      console.error("Error adding todo:", error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  };

  const toggleComplete = async (id: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_completed: isCompleted,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update todo");
      }

      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, is_completed: isCompleted } : todo
        )
      );
    } catch (error) {
      console.error("Error updating todo:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  // Get only active todos and limit to 3 for the mobile view
  const activeTodos = todos
    .filter(todo => !todo.is_completed)
    .slice(0, 3);

  const totalActiveTodos = todos.filter(todo => !todo.is_completed).length;
  const hasMoreTodos = totalActiveTodos > 3;

  return (
    <div className="bg-background rounded-xl shadow-sm border border-border/50 overflow-hidden mb-6">
      <div className="p-4 border-b border-border/50">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            To-Do List
          </h3>
          <Link href="/dashboard/todos" className="text-xs text-primary flex items-center">
            View All
            <ChevronRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={addTodo} className="flex gap-2 mb-4">
          <Input
            placeholder="Add a new task..."
            value={newTodoContent}
            onChange={(e) => setNewTodoContent(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        {loading ? (
          <div className="py-4 text-center text-muted-foreground">
            Loading tasks...
          </div>
        ) : activeTodos.length > 0 ? (
          <div className="space-y-3">
            {activeTodos.map((todo) => (
              <div key={todo.id} className="flex items-start gap-2 p-2 rounded-lg border border-border/50 hover:border-primary/20 transition-colors">
                <Checkbox
                  checked={todo.is_completed}
                  onCheckedChange={() => toggleComplete(todo.id, !todo.is_completed)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm break-words">{todo.content}</p>
                </div>
              </div>
            ))}

            {hasMoreTodos && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/todos">
                    View {totalActiveTodos - 3} more
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-muted-foreground text-sm mb-4">
              No active tasks. Add a new task to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

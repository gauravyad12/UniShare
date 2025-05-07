"use client";

import { useState, useEffect } from "react";
import TodoItem from "@/components/todo-item";
import TodoForm from "@/components/todo-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCheck } from "lucide-react";
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

interface TodoListProps {
  limit?: number;
}

export default function TodoList({ limit }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

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
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (content: string, dueDate?: Date | null, priority?: string | null) => {
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          due_date: dueDate ? dueDate.toISOString() : null,
          priority,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add todo");
      }

      const data = await response.json();
      setTodos([data.todo, ...todos]);
    } catch (error) {
      console.error("Error adding todo:", error);
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
    }
  };

  const updateTodo = async (id: string, content: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update todo");
      }

      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, content } : todo
        )
      );
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete todo");
      }

      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  const clearCompletedTodos = async () => {
    const completedTodos = todos.filter((todo) => todo.is_completed);

    if (completedTodos.length === 0) {
      console.log("No completed tasks to clear");
      return;
    }

    try {
      // Delete each completed todo
      await Promise.all(
        completedTodos.map((todo) =>
          fetch(`/api/todos/${todo.id}`, {
            method: "DELETE",
          })
        )
      );

      setTodos(todos.filter((todo) => !todo.is_completed));
    } catch (error) {
      console.error("Error clearing completed todos:", error);
    }
  };

  // Filter todos based on active tab
  const filteredTodos = todos.filter((todo) => {
    if (activeTab === "active") return !todo.is_completed;
    if (activeTab === "completed") return todo.is_completed;
    return true; // "all" tab
  });

  // Apply limit if specified
  const limitedTodos = limit ? filteredTodos.slice(0, limit) : filteredTodos;
  const hasMoreTodos = limit && filteredTodos.length > limit;

  const activeTodosCount = todos.filter((todo) => !todo.is_completed).length;
  const completedTodosCount = todos.filter((todo) => todo.is_completed).length;

  return (
    <div className="space-y-4">
      <TodoForm onAddTodo={addTodo} />

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All ({todos.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeTodosCount})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Done ({completedTodosCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTodos.length > 0 ? (
            <div className="space-y-2">
              {limitedTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={toggleComplete}
                  onDelete={deleteTodo}
                  onUpdate={updateTodo}
                />
              ))}
              {hasMoreTodos && (
                <div className="text-center pt-4">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/dashboard/todos">View All Tasks</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found. Add a new task to get started.
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTodos.length > 0 ? (
            <div className="space-y-2">
              {limitedTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={toggleComplete}
                  onDelete={deleteTodo}
                  onUpdate={updateTodo}
                />
              ))}
              {hasMoreTodos && (
                <div className="text-center pt-4">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/dashboard/todos">View All Tasks</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No active tasks. All caught up!
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTodos.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompletedTodos}
                  className="flex items-center gap-1"
                >
                  <CheckCheck className="h-4 w-4" />
                  Clear done
                </Button>
              </div>
              <div className="space-y-2">
                {limitedTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggleComplete={toggleComplete}
                    onDelete={deleteTodo}
                    onUpdate={updateTodo}
                  />
                ))}
                {hasMoreTodos && (
                  <div className="text-center pt-4">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/dashboard/todos">View All Tasks</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No done tasks yet.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

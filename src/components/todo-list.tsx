"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import TodoItem from "@/components/todo-item";
import TodoForm from "@/components/todo-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCheck } from "lucide-react";

interface Todo {
  id: string;
  content: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  due_date?: string | null;
  priority?: "low" | "medium" | "high" | null;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
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
      
      toast({
        title: "Success",
        description: "Task added to your to-do list",
      });
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
      
      toast({
        title: "Success",
        description: "Task updated",
      });
    } catch (error) {
      console.error("Error updating todo:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
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
      
      toast({
        title: "Success",
        description: "Task deleted",
      });
    } catch (error) {
      console.error("Error deleting todo:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const clearCompletedTodos = async () => {
    const completedTodos = todos.filter((todo) => todo.is_completed);
    
    if (completedTodos.length === 0) {
      toast({
        title: "Info",
        description: "No completed tasks to clear",
      });
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
      
      toast({
        title: "Success",
        description: `Cleared ${completedTodos.length} completed tasks`,
      });
    } catch (error) {
      console.error("Error clearing completed todos:", error);
      toast({
        title: "Error",
        description: "Failed to clear completed tasks",
        variant: "destructive",
      });
    }
  };

  // Filter todos based on active tab
  const filteredTodos = todos.filter((todo) => {
    if (activeTab === "active") return !todo.is_completed;
    if (activeTab === "completed") return todo.is_completed;
    return true; // "all" tab
  });

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
            Completed ({completedTodosCount})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTodos.length > 0 ? (
            <div className="space-y-2">
              {filteredTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={toggleComplete}
                  onDelete={deleteTodo}
                  onUpdate={updateTodo}
                />
              ))}
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
              {filteredTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={toggleComplete}
                  onDelete={deleteTodo}
                  onUpdate={updateTodo}
                />
              ))}
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
                  Clear completed
                </Button>
              </div>
              <div className="space-y-2">
                {filteredTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggleComplete={toggleComplete}
                    onDelete={deleteTodo}
                    onUpdate={updateTodo}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No completed tasks yet.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

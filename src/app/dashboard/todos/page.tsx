import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CheckSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TodoList from "@/components/todo-list";

export const metadata = {
  title: "UniShare | To-Do List",
  description: "Manage your tasks and to-do items",
};

export default async function TodosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect if user is not logged in
  if (!user) {
    return redirect("/sign-in?error=Please sign in to access the dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <CheckSquare className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">To-Do List</h1>
        </div>
        <p className="text-muted-foreground">
          Keep track of your tasks and assignments
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
          <CardDescription>
            Manage your personal to-do list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TodoList />
        </CardContent>
      </Card>
    </div>
  );
}

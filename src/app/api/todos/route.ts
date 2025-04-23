import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET all todos for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const completed = searchParams.get("completed");
    const priority = searchParams.get("priority");

    // Build the query
    let query = supabase
      .from("user_todos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Apply filters if provided
    if (completed !== null) {
      query = query.eq("is_completed", completed === "true");
    }

    if (priority) {
      query = query.eq("priority", priority);
    }

    // Execute the query
    const { data: todos, error } = await query;

    if (error) {
      console.error("Error fetching todos:", error);
      return NextResponse.json(
        { error: "Failed to fetch todos" },
        { status: 500 }
      );
    }

    return NextResponse.json({ todos });
  } catch (error) {
    console.error("Unexpected error in GET /api/todos:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// POST a new todo
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, due_date, priority } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Create the todo
    const { data: todo, error } = await supabase.from("user_todos").insert({
      user_id: user.id,
      content,
      due_date: due_date || null,
      priority: priority || null,
    }).select();

    if (error) {
      console.error("Error creating todo:", error);
      return NextResponse.json(
        { error: "Failed to create todo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ todo: todo[0] });
  } catch (error) {
    console.error("Unexpected error in POST /api/todos:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

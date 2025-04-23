import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// PUT (update) a todo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const todoId = params.id;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!todoId) {
      return NextResponse.json(
        { error: "Todo ID is required" },
        { status: 400 }
      );
    }

    const updates = await request.json();
    
    // Ensure the user can only update their own todos
    const { data: todo, error: fetchError } = await supabase
      .from("user_todos")
      .select("user_id")
      .eq("id", todoId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: "Todo not found" },
        { status: 404 }
      );
    }

    if (todo.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this todo" },
        { status: 403 }
      );
    }

    // Update the todo
    const { data: updatedTodo, error } = await supabase
      .from("user_todos")
      .update(updates)
      .eq("id", todoId)
      .select();

    if (error) {
      console.error("Error updating todo:", error);
      return NextResponse.json(
        { error: "Failed to update todo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ todo: updatedTodo[0] });
  } catch (error) {
    console.error(`Unexpected error in PUT /api/todos/${params.id}:`, error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// DELETE a todo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const todoId = params.id;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!todoId) {
      return NextResponse.json(
        { error: "Todo ID is required" },
        { status: 400 }
      );
    }

    // Ensure the user can only delete their own todos
    const { data: todo, error: fetchError } = await supabase
      .from("user_todos")
      .select("user_id")
      .eq("id", todoId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: "Todo not found" },
        { status: 404 }
      );
    }

    if (todo.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this todo" },
        { status: 403 }
      );
    }

    // Delete the todo
    const { error } = await supabase
      .from("user_todos")
      .delete()
      .eq("id", todoId);

    if (error) {
      console.error("Error deleting todo:", error);
      return NextResponse.json(
        { error: "Failed to delete todo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Unexpected error in DELETE /api/todos/${params.id}:`, error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

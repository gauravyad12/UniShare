import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET pinned messages for a study group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const groupId = params.id;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!groupId) {
      return NextResponse.json(
        { error: "Study group ID is required" },
        { status: 400 }
      );
    }

    // Check if user is a member of the study group
    const { data: membership, error: membershipError } = await supabase
      .from("study_group_members")
      .select("*")
      .eq("study_group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "You are not a member of this study group" },
        { status: 403 }
      );
    }

    // Get pinned messages
    const { data: pinnedMessages, error } = await supabase
      .from("group_chat_messages_with_profiles")
      .select("*")
      .eq("study_group_id", groupId)
      .eq("is_pinned", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pinned messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch pinned messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pinnedMessages
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function DELETE(
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

    console.log("Deleting study group with ID:", groupId);
    console.log("User ID:", user.id);

    // Use the security definer function to delete the study group
    // This bypasses RLS and avoids infinite recursion
    const { data: success, error: deleteError } = await supabase.rpc(
      "delete_study_group",
      {
        p_group_id: groupId,
        p_user_id: user.id
      }
    );

    if (deleteError) {
      console.error("Error deleting study group:", deleteError);

      // Check for specific error types
      if (deleteError.code === "42501" || deleteError.message?.includes("permission denied")) {
        return NextResponse.json(
          { error: "You don't have permission to delete this study group." },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: "Failed to delete study group" },
        { status: 500 }
      );
    }

    // If the function returned false, the user doesn't have permission
    if (success === false) {
      return NextResponse.json(
        { error: "Only the creator or admins can delete this study group" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

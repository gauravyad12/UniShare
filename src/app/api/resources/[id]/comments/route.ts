import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Helper function to update the comment count directly in the database
async function updateResourceCommentCount(
  supabase,
  resourceId,
  increment = true,
) {
  try {
    // Use the increment_column_value RPC function to update the comment count
    const { data, error } = await supabase.rpc("increment_column_value", {
      p_table_name: "resources",
      p_column_name: "comment_count",
      p_record_id: resourceId,
      p_increment_by: increment ? 1 : -1,
    });

    if (error) {
      console.error("Error updating comment count:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error updating comment count:", err);
    return false;
  }
}

// GET comments for a resource
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createClient();
    const resourceId = params.id;

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 },
      );
    }

    // Get comments for the resource with user information using the view
    const { data: comments, error } = await supabase
      .from("resource_comments_with_profiles")
      .select()
      .eq("resource_id", resourceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 },
      );
    }

    // Transform the data to match the expected format in the frontend
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      comment: comment.comment,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user_id: comment.user_id,
      resource_id: comment.resource_id,
      user_profiles: {
        id: comment.profile_id,
        full_name: comment.full_name,
        username: comment.username,
        avatar_url: comment.avatar_url,
      },
    }));

    // Get the current resource to get the comment_count
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("comment_count")
      .eq("id", resourceId)
      .single();

    if (resourceError) {
      console.error("Error fetching resource:", resourceError);
    }

    // Use the resource's comment_count if available, otherwise count the comments
    let commentCount = 0;
    if (resource && typeof resource.comment_count === "number") {
      commentCount = resource.comment_count;
    } else {
      // Fallback to counting comments if needed
      const { count, error: countError } = await supabase
        .from("resource_comments")
        .select("id", { count: true })
        .eq("resource_id", resourceId);

      if (countError) {
        console.error("Error counting comments:", countError);
      } else {
        commentCount = count || 0;
      }
    }

    return NextResponse.json({
      comments: formattedComments,
      count: commentCount,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

// POST a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const resourceId = params.id;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 },
      );
    }

    // Get the comment text from the request body
    const { comment } = await request.json();

    if (!comment || typeof comment !== "string" || comment.trim() === "") {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400 },
      );
    }

    // Check if the resource exists
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("id, comment_count")
      .eq("id", resourceId)
      .single();

    if (resourceError) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }

    // Insert the comment - don't try to select in the same operation
    const { data: insertedComment, error: insertError } = await supabase
      .from("resource_comments")
      .insert({
        resource_id: resourceId,
        user_id: user.id,
        comment: comment.trim(),
      })
      .select("id");

    if (insertError) {
      console.error("Error creating comment:", insertError);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 },
      );
    }

    // Update the comment count on the resource
    await updateResourceCommentCount(supabase, resourceId, true);

    // Fetch the newly created comment with user profile data using the view
    const { data: newCommentData, error: fetchError } = await supabase
      .from("resource_comments_with_profiles")
      .select()
      .eq("id", insertedComment[0].id)
      .single();

    if (fetchError) {
      console.error("Error fetching new comment:", fetchError);
      return NextResponse.json(
        { error: "Comment created but failed to fetch details" },
        { status: 500 },
      );
    }

    // Format the comment to match the expected structure in the frontend
    const newComment = {
      id: newCommentData.id,
      comment: newCommentData.comment,
      created_at: newCommentData.created_at,
      updated_at: newCommentData.updated_at,
      user_id: newCommentData.user_id,
      resource_id: newCommentData.resource_id,
      user_profiles: {
        id: newCommentData.profile_id,
        full_name: newCommentData.full_name,
        username: newCommentData.username,
        avatar_url: newCommentData.avatar_url,
      },
    };

    // Get the updated resource to get the latest comment_count
    const { data: updatedResource, error: updatedResourceError } =
      await supabase
        .from("resources")
        .select("comment_count")
        .eq("id", resourceId)
        .single();

    if (updatedResourceError) {
      console.error("Error fetching updated resource:", updatedResourceError);
    }

    // Use the updated comment count from the resource
    const updatedCommentCount = updatedResource?.comment_count || 0;

    return NextResponse.json({
      comment: newComment,
      count: updatedCommentCount,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

// DELETE a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const resourceId = params.id;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the comment ID from the request
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 },
      );
    }

    // Check if the user is the author of the comment
    const { data: comment, error: commentError } = await supabase
      .from("resource_comments")
      .select("user_id")
      .eq("id", commentId)
      .eq("resource_id", resourceId)
      .single();

    if (commentError) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json(
        { error: "You are not authorized to delete this comment" },
        { status: 403 },
      );
    }

    // Delete the comment
    const { error: deleteError } = await supabase
      .from("resource_comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      console.error("Error deleting comment:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete comment" },
        { status: 500 },
      );
    }

    // Update the comment count on the resource
    await updateResourceCommentCount(supabase, resourceId, false);

    // Get the updated resource to get the latest comment_count
    const { data: updatedResource, error: updatedResourceError } =
      await supabase
        .from("resources")
        .select("comment_count")
        .eq("id", resourceId)
        .single();

    if (updatedResourceError) {
      console.error("Error fetching updated resource:", updatedResourceError);
    }

    // Use the updated comment count from the resource
    const updatedCommentCount = updatedResource?.comment_count || 0;

    return NextResponse.json({
      success: true,
      count: updatedCommentCount,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

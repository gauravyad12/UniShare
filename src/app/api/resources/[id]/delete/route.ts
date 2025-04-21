import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


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

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 },
      );
    }

    // Check if user is the author of the resource
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("author_id, file_url")
      .eq("id", resourceId)
      .single();

    if (resourceError) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }

    if (resource.author_id !== user.id) {
      return NextResponse.json(
        { error: "You are not authorized to delete this resource" },
        { status: 403 },
      );
    }

    // Delete the resource
    const { error: deleteError } = await supabase
      .from("resources")
      .delete()
      .eq("id", resourceId);

    if (deleteError) {
      console.error("Error deleting resource:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete resource" },
        { status: 500 },
      );
    }

    // If there's a file associated with the resource, delete it from storage
    if (resource.file_url) {
      try {
        // Extract the file path from the URL
        // The URL format is typically: https://<project-ref>.supabase.co/storage/v1/object/public/resources/<path>
        // We need to extract just the path part after 'resources/'
        const filePathMatch = resource.file_url.match(/resources\/([^?]+)/);
        if (filePathMatch && filePathMatch[1]) {
          const filePath = filePathMatch[1];
          console.log("Attempting to delete file:", filePath);

          const { error: storageError } = await supabase.storage
            .from("resources")
            .remove([filePath]);

          if (storageError) {
            console.error("Error deleting file from storage:", storageError);
            // Continue despite error - the resource record was deleted successfully
          } else {
            console.log("Successfully deleted file from storage:", filePath);
          }
        } else {
          console.error(
            "Could not extract file path from URL:",
            resource.file_url,
          );
        }
      } catch (fileError) {
        console.error("Exception when deleting file from storage:", fileError);
        // Continue despite error - the resource record was deleted successfully
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

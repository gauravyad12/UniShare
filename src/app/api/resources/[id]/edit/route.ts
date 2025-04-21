import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


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

    // Check if user is the author of the resource
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("author_id")
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
        { error: "You are not authorized to edit this resource" },
        { status: 403 },
      );
    }

    // Get the updated data from the request
    const data = await request.json();

    // Check for bad words in text fields
    const { containsBadWords } = await import('@/utils/badWords');

    // Check title
    if (data.title && await containsBadWords(data.title)) {
      return NextResponse.json(
        { error: "Title contains inappropriate language" },
        { status: 400 },
      );
    }

    // Check description
    if (data.description && await containsBadWords(data.description)) {
      return NextResponse.json(
        { error: "Description contains inappropriate language" },
        { status: 400 },
      );
    }

    // Check course code
    if (data.course_code && await containsBadWords(data.course_code)) {
      return NextResponse.json(
        { error: "Course code contains inappropriate language" },
        { status: 400 },
      );
    }

    // Update the resource
    const { error: updateError } = await supabase
      .from("resources")
      .update({
        title: data.title,
        description: data.description,
        resource_type: data.resource_type,
        course_code: data.course_code,
        external_link: data.external_link,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resourceId);

    if (updateError) {
      console.error("Error updating resource:", updateError);
      return NextResponse.json(
        { error: "Failed to update resource" },
        { status: 500 },
      );
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

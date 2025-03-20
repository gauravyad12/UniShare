import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as string;
    const courseCode = formData.get("course_code") as string;
    const file = formData.get("file") as File;
    const externalUrl = formData.get("external_url") as string;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (type !== "link" && !file) {
      return NextResponse.json(
        { error: "File is required for non-link resources" },
        { status: 400 },
      );
    }

    if (type === "link" && !externalUrl) {
      return NextResponse.json(
        { error: "URL is required for link resources" },
        { status: 400 },
      );
    }

    // Get user profile to get university_id
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("university_id, full_name, username")
      .eq("id", user.id)
      .single();

    if (!userProfile?.university_id) {
      return NextResponse.json(
        { error: "User profile or university not found" },
        { status: 400 },
      );
    }

    let fileUrl = null;

    // Upload file if provided
    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `resources/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("resources")
        .upload(filePath, file);

      if (uploadError) {
        console.error("File upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload file" },
          { status: 500 },
        );
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("resources").getPublicUrl(filePath);

      fileUrl = publicUrl;
    }

    // Create resource record
    const { data: resource, error } = await supabase
      .from("resources")
      .insert({
        title,
        description,
        type,
        course_code: courseCode,
        file_url: fileUrl,
        external_url: externalUrl,
        author_id: user.id,
        author_name:
          userProfile.full_name || userProfile.username || user.email,
        university_id: userProfile.university_id,
        is_approved: true, // Auto-approve for now
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating resource:", error);
      return NextResponse.json(
        { error: "Failed to create resource" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

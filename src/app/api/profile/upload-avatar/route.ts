import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_IMAGE_TYPES, MAX_AVATAR_SIZE, validateImageFile } from "@/utils/imageValidation";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate the image file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Skip bucket creation - assume the bucket already exists
    // Bucket creation should be done via migrations or admin panel

    // Upload the file
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 },
      );
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // Update the user's profile with the new avatar URL
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile with avatar URL:", updateError);
      return NextResponse.json(
        { error: `Failed to update profile: ${updateError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, avatarUrl: publicUrl });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 },
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

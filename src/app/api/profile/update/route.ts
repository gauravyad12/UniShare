import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { detectUniversityFromEmail } from "@/utils/utils";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.json();
    const {
      full_name,
      username,
      bio,
      major,
      graduation_year,
      avatar_url,
      university_id,
    } = formData;

    console.log("Updating profile with data:", {
      full_name,
      username,
      bio,
      major,
      graduation_year,
      university_id,
    });

    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("user_profiles")
      .select("id, university_id")
      .eq("id", user.id)
      .single();

    // If no university_id is provided, try to detect it from email
    let detectedUniversityId = university_id;
    if (!detectedUniversityId && user.email) {
      const university = await detectUniversityFromEmail(user.email);
      if (university) {
        detectedUniversityId = university.id;
      }
    }

    // Prepare update data
    const profileData = {
      full_name,
      username,
      bio,
      major,
      graduation_year: graduation_year ? parseInt(graduation_year) : null,
      university_id: detectedUniversityId || existingProfile?.university_id,
      updated_at: new Date().toISOString(),
    };

    // Add avatar_url if it exists
    if (avatar_url) {
      profileData.avatar_url = avatar_url;
    }

    let updateMethod;
    if (!existingProfile) {
      // Create profile if it doesn't exist
      updateMethod = supabase.from("user_profiles").insert({
        id: user.id,
        ...profileData,
        created_at: new Date().toISOString(),
      });
    } else {
      // Update existing profile
      updateMethod = supabase
        .from("user_profiles")
        .update(profileData)
        .eq("id", user.id);
    }

    const { error } = await updateMethod;

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json(
        { error: `Failed to update profile: ${error.message}` },
        { status: 500 },
      );
    }

    // Also update user metadata in auth
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name,
        username,
        bio,
        major,
        graduation_year: graduation_year ? parseInt(graduation_year) : null,
        university_id: detectedUniversityId || existingProfile?.university_id,
      },
    });

    if (authError) {
      console.error("Error updating auth metadata:", authError);
      // Continue despite auth metadata update error
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 },
    );
  }
}

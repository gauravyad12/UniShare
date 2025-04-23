import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { detectUniversityFromEmail } from "@/utils/utils";

export const dynamic = "force-dynamic";


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
      courses,
    } = formData;

    console.log("Updating profile with data:", {
      full_name,
      username,
      bio,
      major,
      graduation_year,
      university_id,
      courses: courses ? `${courses.length} courses` : 'none',
    });

    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("user_profiles")
      .select("id, university_id, username")
      .eq("id", user.id)
      .single();

    // If username is changing, check if it's already taken (case-insensitive exact match)
    if (
      username &&
      username.toLowerCase() !== existingProfile?.username?.toLowerCase()
    ) {
      const { data: existingUsernames } = await supabase
        .from("user_profiles")
        .select("username")
        .ilike("username", username.toLowerCase());

      if (existingUsernames && existingUsernames.length > 0) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 },
        );
      }
    }

    // Validate required fields
    if (!full_name) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 },
      );
    }

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    // Check for bad words in text fields
    const { containsBadWords, getFirstBadWord } = await import('@/utils/badWords');

    // Check full name
    if (await containsBadWords(full_name)) {
      return NextResponse.json(
        { error: "Full name contains inappropriate language" },
        { status: 400 },
      );
    }

    // Check username
    if (await containsBadWords(username)) {
      return NextResponse.json(
        { error: "Username contains inappropriate language" },
        { status: 400 },
      );
    }

    // Check bio
    if (bio && await containsBadWords(bio)) {
      return NextResponse.json(
        { error: "Bio contains inappropriate language" },
        { status: 400 },
      );
    }

    // Check major
    if (major && await containsBadWords(major)) {
      return NextResponse.json(
        { error: "Major contains inappropriate language" },
        { status: 400 },
      );
    }

    // Validate graduation year
    if (graduation_year) {
      const year = parseInt(graduation_year);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear + 10) {
        return NextResponse.json(
          {
            error:
              "Graduation year must be between 1900 and 10 years in the future",
          },
          { status: 400 },
        );
      }
    }

    // If no university_id is provided, try to detect it from email
    let detectedUniversityId = university_id;
    if (!detectedUniversityId && user.email) {
      const university = await detectUniversityFromEmail(user.email);
      if (university) {
        detectedUniversityId = university.id;
      }
    }

    // Prepare update data (store username in lowercase)
    const profileData: any = {
      full_name,
      username: username ? username.toLowerCase() : null,
      bio,
      major,
      graduation_year: graduation_year ? parseInt(graduation_year) : null,
      university_id: detectedUniversityId || existingProfile?.university_id,
      updated_at: new Date().toISOString(),
    };

    // Always set university_name to avoid errors
    if (detectedUniversityId) {
      try {
        const { data: universityData } = await supabase
          .from("universities")
          .select("name")
          .eq("id", detectedUniversityId)
          .single();

        if (universityData?.name) {
          profileData.university_name = universityData.name;
        } else {
          // Fallback to a default value if we can't get the name
          profileData.university_name = "University";
        }
      } catch (error) {
        console.error("Error fetching university name:", error);
        // Set a default value to avoid null errors
        profileData.university_name = "University";
      }
    } else if (existingProfile?.university_id) {
      try {
        const { data: universityData } = await supabase
          .from("universities")
          .select("name")
          .eq("id", existingProfile.university_id)
          .single();

        if (universityData?.name) {
          profileData.university_name = universityData.name;
        } else {
          profileData.university_name = "University";
        }
      } catch (error) {
        console.error("Error fetching university name:", error);
        profileData.university_name = "University";
      }
    } else {
      // Default value if no university ID is available
      profileData.university_name = "University";
    }

    // Add avatar_url if it exists
    if (avatar_url) {
      profileData.avatar_url = avatar_url;
    } else {
      // Ensure avatar_url is explicitly set to null if not provided
      // This prevents issues when accessing this property later
      profileData.avatar_url = null;
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

    // Handle courses update if courses array is provided
    if (courses && Array.isArray(courses)) {
      try {
        // First, delete all existing courses for this user
        const { error: deleteError } = await supabase
          .from("user_courses")
          .delete()
          .eq("user_id", user.id);

        if (deleteError) {
          console.error("Error deleting existing courses:", deleteError);
          // Continue despite error
        }

        // Then, insert the new courses if there are any
        if (courses.length > 0) {
          const coursesToInsert = courses.map(course => ({
            user_id: user.id,
            course_code: course,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const { error: insertError } = await supabase
            .from("user_courses")
            .insert(coursesToInsert);

          if (insertError) {
            console.error("Error inserting courses:", insertError);
            // Continue despite error
          }
        }
      } catch (courseError) {
        console.error("Error updating courses:", courseError);
        // Continue despite error
      }
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

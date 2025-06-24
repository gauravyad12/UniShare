import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const resourceType = formData.get("type") as string;
    const courseCode = formData.get("course_code") as string;
    const file = formData.get("file") as File;
    const externalLink = formData.get("external_link") as string;
    const professor = formData.get("professor") as string;
    const professorData = formData.get("professor_data") as string;

    // Log professor data for debugging
    if (professor) {
      console.log('Professor attached to resource:', professor);
    } else {
      console.log('No professor attached to resource');
    }

    // Character limits
    const charLimits = {
      title: 25,
      description: 100,
      courseCode: 10,
      externalLink: 100
    };

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Check character limits
    if (title.length > charLimits.title) {
      return NextResponse.json(
        { error: `Title must be ${charLimits.title} characters or less` },
        { status: 400 }
      );
    }

    if (description && description.length > charLimits.description) {
      return NextResponse.json(
        { error: `Description must be ${charLimits.description} characters or less` },
        { status: 400 }
      );
    }

    if (courseCode && courseCode.length > charLimits.courseCode) {
      return NextResponse.json(
        { error: `Course code must be ${charLimits.courseCode} characters or less` },
        { status: 400 }
      );
    }

    if (externalLink && externalLink.length > charLimits.externalLink) {
      return NextResponse.json(
        { error: `External URL must be ${charLimits.externalLink} characters or less` },
        { status: 400 }
      );
    }

    if (resourceType !== "link" && !file) {
      return NextResponse.json(
        { error: "File is required for non-link resources" },
        { status: 400 },
      );
    }

    // Validate file type (only PDF allowed)
    if (file && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 },
      );
    }

    if (resourceType === "link") {
      if (!externalLink) {
        return NextResponse.json(
          { error: "URL is required for link resources" },
          { status: 400 },
        );
      }

      // Check URL safety on the server side
      if (externalLink) {
        try {
          // Use direct API call to the safety check endpoint
          // This avoids using window.location which is not available in server components
          // Use dynamic domain configuration
          let baseUrl;
          if (process.env.NODE_ENV === 'development') {
            baseUrl = `http://localhost:${process.env.PORT || 3000}`;
          } else {
            baseUrl = `https://${process.env.NEXT_PUBLIC_DOMAIN}`;
          }

          const apiUrl = new URL('/api/url/check-safety', baseUrl).toString();

          const safetyResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: externalLink }),
          });

          if (safetyResponse.ok) {
            const safetyResult = await safetyResponse.json();

            if (!safetyResult.isSafe) {
              return NextResponse.json(
                { error: `This link has been flagged as potentially unsafe (${safetyResult.threatType || 'Unknown threat'}) and cannot be submitted.` },
                { status: 400 },
              );
            }
          } else {
            console.error("URL safety check API responded with error:", await safetyResponse.text());
            // Continue with the submission if the safety check fails
          }
        } catch (error) {
          console.error("Error checking URL safety:", error);
          // Continue with the submission if the safety check fails
          // This is a fallback to avoid blocking legitimate content
        }
      }
    }

    // Check for bad words in text fields
    const { containsBadWords } = await import('@/utils/badWords');

    // Check title
    if (await containsBadWords(title)) {
      return NextResponse.json(
        { error: "Title contains inappropriate language" },
        { status: 400 },
      );
    }

    // Check description
    if (description && await containsBadWords(description)) {
      return NextResponse.json(
        { error: "Description contains inappropriate language" },
        { status: 400 },
      );
    }

    // Check course code
    if (courseCode && await containsBadWords(courseCode)) {
      return NextResponse.json(
        { error: "Course code contains inappropriate language" },
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

      const { error: uploadError } = await supabase.storage
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
        resource_type: resourceType,
        course_code: courseCode,
        file_url: fileUrl,
        external_link: externalLink,
        author_id: user.id,
        university_id: userProfile.university_id,
        professor: professor || null, // Add professor name
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

    // Removed duplicate call to /api/thumbnails/generate

    // Generate thumbnail for the resource
    if (resource) {
      try {
        console.log('Triggering immediate thumbnail generation for new resource:', resource.id);
        // Try to generate the thumbnail immediately, but don't block the response
        const thumbnailPromise = fetch(`${request.nextUrl.origin}/api/thumbnails/screenshot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceId: resource.id,
            resourceType,
            fileUrl,
            externalLink,
          }),
        });

        // Notifications are now handled by database triggers
        if (courseCode) {
          console.log(`Resource created with course code ${courseCode} - notifications will be handled by database triggers`);
        }

        // Add a timeout to ensure we don't wait too long
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Thumbnail generation timeout')), 5000);
        });

        // Race the thumbnail generation against the timeout
        Promise.race([thumbnailPromise, timeoutPromise])
          .then(response => {
            if (response instanceof Response) {
              console.log('Thumbnail generation response status:', response.status);
              return response.json();
            }
            return null;
          })
          .then(data => {
            if (data) {
              console.log('Thumbnail generated successfully:', data);
            }
          })
          .catch(e => console.error('Background thumbnail generation failed:', e));
      } catch (e) {
        console.error('Error triggering thumbnail generation:', e);
        // Don't fail the request if thumbnail generation fails
      }
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

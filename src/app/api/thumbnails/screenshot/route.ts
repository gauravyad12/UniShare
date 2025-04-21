import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Set max duration to 60 seconds for screenshot generation

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { resourceId, resourceType, externalLink, fileUrl } = body;

    if (!resourceId) {
      return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
    }

    console.log("Generating thumbnail for resource:", resourceId);

    // Check if the resource already has a thumbnail
    const { data: resource } = await supabase
      .from('resources')
      .select('thumbnail_url')
      .eq('id', resourceId)
      .single();

    // If the resource already has a thumbnail, return it
    if (resource && resource.thumbnail_url) {
      console.log("Resource already has a thumbnail:", resource.thumbnail_url);
      return NextResponse.json({ success: true, thumbnailUrl: resource.thumbnail_url });
    }

    try {
      let screenshotUrl = "";
      let thumbnailPath = "";

      // Helper function to format URL for screenshot API
      const formatUrlForScreenshot = (url: string) => {
        // Remove protocol and www
        return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
      };

      // Generate screenshots for external links and PDF files
      console.log("Resource type:", resourceType, "File URL:", fileUrl);

      // Note about Screenshot Machine API parameters:
      // - cacheLimit=0: Always generate a fresh screenshot instead of using a cached version
      // - delay: Wait time in milliseconds before taking the screenshot (500ms for PDFs)
      // - format: Output format of the screenshot (png for better quality)
      // - user-agent: Using Safari user agent for PDFs as it has fewer toolbars
      // - hide: UI elements to hide (toolbar, scrollbar, etc.)

      if (resourceType === "link" && externalLink) {
        // For external links, use the screenshot API
        const formattedUrl = formatUrlForScreenshot(externalLink);
        screenshotUrl = `https://api.screenshotmachine.com?key=f2b3ce&url=${encodeURIComponent(formattedUrl)}&dimension=1024x768&format=png&cacheLimit=0&delay=2000`;
        console.log("External link screenshot URL:", screenshotUrl);
        thumbnailPath = `thumbnails/${resourceId}-link.png`;
      } else if (fileUrl && fileUrl.toLowerCase().endsWith(".pdf")) {
        // For PDF files, use the screenshot API with the PDF URL
        // Remove the protocol and www from the URL
        console.log("Processing PDF file URL:", fileUrl);
        const formattedUrl = formatUrlForScreenshot(fileUrl);
        console.log("Formatted PDF URL for screenshot:", formattedUrl);
        // For PDFs, we use additional parameters to hide UI elements and optimize the view
        screenshotUrl = `https://api.screenshotmachine.com?key=f2b3ce&url=${encodeURIComponent(formattedUrl)}&device=phone&dimension=480x800&format=png&cacheLimit=0&delay=2000`;
        console.log("PDF screenshot URL:", screenshotUrl);
        thumbnailPath = `thumbnails/${resourceId}-pdf.png`;
      } else {
        // For other resource types, we don't generate thumbnails anymore
        return NextResponse.json({
          success: false,
          message: "No thumbnail generated for this resource type"
        });
      }

      console.log("Screenshot URL:", screenshotUrl);

      // Helper function to fetch with retries
      const fetchWithRetry = async (url: string, maxRetries = 3, delay = 2000) => {
        let lastError;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            console.log(`Attempt ${attempt + 1}/${maxRetries} to fetch screenshot`);
            const response = await fetch(url);

            if (response.ok) {
              return response;
            }

            lastError = new Error(`Failed to fetch screenshot: ${response.statusText}`);
            console.log(`Attempt ${attempt + 1} failed with status ${response.status}. ${attempt < maxRetries - 1 ? 'Retrying...' : 'No more retries.'}`);
          } catch (error: any) {
            lastError = error;
            console.log(`Attempt ${attempt + 1} failed with error: ${error?.message || 'Unknown error'}. ${attempt < maxRetries - 1 ? 'Retrying...' : 'No more retries.'}`);
          }

          if (attempt < maxRetries - 1) {
            // Wait before next retry
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

        throw lastError;
      };

      // Fetch the screenshot with retries
      console.log("Starting screenshot fetch with retries...");
      const screenshotResponse = await fetchWithRetry(screenshotUrl);
      console.log("Screenshot fetch successful, status:", screenshotResponse.status);

      // Get the screenshot as a buffer
      console.log("Converting screenshot to buffer...");
      const screenshotBuffer = await screenshotResponse.arrayBuffer();
      console.log("Screenshot buffer size:", screenshotBuffer.byteLength, "bytes");

      // Upload the screenshot to Supabase Storage
      console.log("Uploading screenshot to Supabase Storage:", thumbnailPath);
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resources')
          .upload(thumbnailPath, screenshotBuffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadData) {
          console.log("Upload successful, data:", uploadData);
        }

        if (uploadError) {
          console.error("Error uploading screenshot:", uploadError);
          return NextResponse.json({ error: "Failed to upload screenshot" }, { status: 500 });
        }
      } catch (uploadException) {
        console.error("Exception during upload:", uploadException);
        return NextResponse.json({ error: "Exception during upload" }, { status: 500 });
      }

      // Get public URL for the screenshot
      console.log("Getting public URL for path:", thumbnailPath);
      let publicUrl = "";
      try {
        const urlResult = supabase.storage
          .from('resources')
          .getPublicUrl(thumbnailPath);

        publicUrl = urlResult.data.publicUrl;

        console.log("Screenshot uploaded, public URL:", publicUrl);

        if (!publicUrl) {
          console.error("Failed to get public URL - publicUrl is empty");
          return NextResponse.json({ error: "Failed to get public URL" }, { status: 500 });
        }
      } catch (urlException) {
        console.error("Exception getting public URL:", urlException);
        return NextResponse.json({ error: "Exception getting public URL" }, { status: 500 });
      }

      // Update the resource with the screenshot URL
      console.log("Updating resource with thumbnail URL:", { resourceId, publicUrl });
      try {
        const { data: updateData, error: updateError } = await supabase
          .from('resources')
          .update({ thumbnail_url: publicUrl })
          .eq('id', resourceId);

        if (updateData) {
          console.log("Resource update successful:", updateData);
        }

        if (updateError) {
          console.error("Error updating resource with screenshot URL:", updateError);
          return NextResponse.json({ error: "Failed to update resource" }, { status: 500 });
        }
      } catch (updateException) {
        console.error("Exception updating resource:", updateException);
        return NextResponse.json({ error: "Exception updating resource" }, { status: 500 });
      }

      return NextResponse.json({ success: true, thumbnailUrl: publicUrl });
    } catch (error) {
      console.error("Error generating screenshot:", error);
      return NextResponse.json({ error: "Failed to generate screenshot" }, { status: 500 });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

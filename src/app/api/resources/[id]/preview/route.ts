import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const resourceId = params.id;

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    // Get the resource to find the file URL
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("file_url, title, resource_type")
      .eq("id", resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // If file_url exists and it's a PDF, redirect to it
    if (resource.file_url && resource.file_url.toLowerCase().endsWith(".pdf")) {
      // Set headers to indicate this is for preview only
      const headers = new Headers();
      headers.set("Content-Type", "application/pdf");
      headers.set("Content-Disposition", "inline");

      // Create a URL with parameters for PDF.js
      const previewUrl = `${resource.file_url}#page=1&view=FitH&toolbar=0&navpanes=0`;

      // Redirect to the actual file URL with PDF.js parameters
      return NextResponse.redirect(previewUrl, { headers });
    }

    // For non-PDF resources, return a 404
    return NextResponse.json(
      { error: "No preview available for this resource" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

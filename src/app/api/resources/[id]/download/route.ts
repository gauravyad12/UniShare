import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


// Simple helper to handle errors silently
const silentTry = async (fn: () => Promise<any>, fallbackValue: any = null) => {
  try {
    return await fn();
  } catch (error) {
    console.log("Silent error handled:", error);
    return fallbackValue;
  }
};

// Shared handler for both GET and POST requests
async function handleDownload(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createClient();
    const resourceId = params.id;

    // Get user but don't fail if not authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 },
      );
    }

    // Allow anonymous downloads but track them differently
    const userId = user?.id || "anonymous";

    // First check if resource_downloads table exists, if not create it
    const { error: tableCheckError } = await supabase.rpc("execute_sql", {
      query: `
          CREATE TABLE IF NOT EXISTS resource_downloads (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(resource_id, user_id)
          );
          
          ALTER TABLE resource_downloads ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Users can see their own downloads" ON resource_downloads;
          CREATE POLICY "Users can see their own downloads"
            ON resource_downloads FOR SELECT
            USING (auth.uid() = user_id);
            
          DROP POLICY IF EXISTS "Users can insert their own downloads" ON resource_downloads;
          CREATE POLICY "Users can insert their own downloads"
            ON resource_downloads FOR INSERT
            WITH CHECK (auth.uid() = user_id);
            
          DROP POLICY IF EXISTS "Service role can insert downloads" ON resource_downloads;
          CREATE POLICY "Service role can insert downloads"
            ON resource_downloads FOR INSERT
            TO service_role
            WITH CHECK (true);
            
          DROP POLICY IF EXISTS "Service role can update downloads" ON resource_downloads;
          CREATE POLICY "Service role can update downloads"
            ON resource_downloads FOR UPDATE
            TO service_role
            USING (true);
            
          SELECT pg_catalog.setval(pg_get_serial_sequence('resource_downloads', 'id'), COALESCE((SELECT MAX(id) FROM resource_downloads), 1), false);
          
          DO $
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = 'resource_downloads'
            ) THEN
              ALTER PUBLICATION supabase_realtime ADD TABLE resource_downloads;
            END IF;
          END
          $;
        `,
    });

    // Check if this is a direct download request or just a record request
    const isRecordOnly = request.url.includes("t=");

    // Only increment the download count for actual download requests, not record-only requests
    if (!isRecordOnly) {
      await silentTry(async () => {
        // Try the RPC method first
        const { error: rpcError } = await supabase.rpc(
          "increment_column_value",
          {
            p_table_name: "resources",
            p_column_name: "downloads",
            p_record_id: resourceId,
            p_increment_by: 1,
          },
        );

        // If RPC fails, fall back to direct SQL update
        if (rpcError) {
          await supabase.rpc("execute_sql", {
            query: `UPDATE resources SET downloads = COALESCE(downloads, 0) + 1 WHERE id = '${resourceId}'`,
          });
        }
      });
    }

    // Only try to record the download in resource_downloads if we have a real user
    if (user) {
      await silentTry(async () => {
        await supabase.from("resource_downloads").upsert(
          {
            resource_id: resourceId,
            user_id: user.id,
            downloaded_at: new Date().toISOString(),
          },
          {
            onConflict: "resource_id,user_id",
            ignoreDuplicates: false,
            returning: "minimal",
          },
        );
      });
    }

    // Get the resource to find the file URL
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("file_url, title")
      .eq("id", resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }

    // If file_url exists, redirect to it for direct download
    if (resource.file_url) {
      // Set headers to force download
      const headers = new Headers();
      headers.set("Content-Type", "application/pdf");
      headers.set(
        "Content-Disposition",
        `attachment; filename="${resource.title || "download"}.pdf"`,
      );

      // Redirect to the actual file URL
      return NextResponse.redirect(resource.file_url, { headers });
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // Handle GET requests the same way as POST
  return handleDownload(request, { params });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return handleDownload(request, { params });
}

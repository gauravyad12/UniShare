import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Debug endpoint to check system status
export async function GET() {
  try {
    // Check environment variables
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? "Set"
        : "Missing",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "Set"
        : "Missing",
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY
        ? "Set"
        : "Missing",
      NEXT_PUBLIC_TEMPO: process.env.NEXT_PUBLIC_TEMPO ? "Set" : "Missing",
    };

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const formattedMemory = {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
    };

    // Test Supabase connection
    let supabaseStatus = "Unknown";
    let dbStatus = "Unknown";
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("universities")
        .select("id")
        .limit(1);

      if (error) {
        supabaseStatus = `Error: ${error.message}`;
        dbStatus = "Failed";
      } else {
        supabaseStatus = "Connected";
        dbStatus = data ? "Data retrieved successfully" : "No data found";
      }
    } catch (e) {
      supabaseStatus = `Connection Error: ${e.message}`;
      dbStatus = "Failed";
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: envVars,
      memory: formattedMemory,
      supabase: {
        status: supabaseStatus,
        database: dbStatus,
      },
      nodeVersion: process.version,
      platform: process.platform,
      uptime: `${Math.floor(process.uptime())} seconds`,
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 },
    );
  }
}

// Handle POST requests for client-side error logging
export async function POST(request: Request) {
  try {
    // Check if request has content before parsing JSON
    const contentType = request.headers.get("content-type");
    let body = {};
    let hasContent = false;

    if (contentType && contentType.includes("application/json")) {
      try {
        const text = await request.text();
        if (text && text.trim()) {
          body = JSON.parse(text);
          hasContent = Object.keys(body).length > 0;
        }
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        // Continue with empty body object
      }
    }

    // Log the error with more context
    if (hasContent) {
      console.error("Client reported error:", body);
    } else {
      // Skip logging empty payloads entirely
      // Only log at debug level if needed
      if (process.env.NODE_ENV === "development") {
        console.debug("Received empty error payload");
      }
    }

    return NextResponse.json({ status: "logged" });
  } catch (error) {
    console.error("Error logging client error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to log error" },
      { status: 500 },
    );
  }
}

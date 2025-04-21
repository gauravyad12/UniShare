import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


// Simple health check endpoint to verify the server is running
export async function GET() {
  try {
    // Check if Supabase environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const envStatus = {
      supabaseUrl: supabaseUrl ? "Set" : "Missing",
      supabaseAnonKey: supabaseAnonKey ? "Set" : "Missing",
    };

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: envStatus,
      message: "Server is running",
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 },
    );
  }
}

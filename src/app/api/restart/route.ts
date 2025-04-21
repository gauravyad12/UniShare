import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


// Simple endpoint to restart the server process
export async function GET() {
  try {
    // Clear any module cache that might be causing issues
    Object.keys(require.cache).forEach(function (key) {
      delete require.cache[key];
    });

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    return NextResponse.json({
      success: true,
      message: "Server cache cleared",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error restarting server:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

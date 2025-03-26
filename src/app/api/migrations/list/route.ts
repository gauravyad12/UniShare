import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 },
      );
    }

    const migrationsDir = path.join(process.cwd(), "supabase/migrations");

    // Check if directory exists
    if (!fs.existsSync(migrationsDir)) {
      return NextResponse.json(
        { error: "Migrations directory not found" },
        { status: 404 },
      );
    }

    // Read all migration files
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort((a, b) => {
        // Sort by timestamp in filename
        const timestampA = a.split("_")[0];
        const timestampB = b.split("_")[0];
        return timestampB.localeCompare(timestampA); // Newest first
      });

    return NextResponse.json({
      migrations: files.map((file) => ({
        filename: file,
        path: `supabase/migrations/${file}`,
        timestamp: file.split("_")[0],
      })),
    });
  } catch (error) {
    console.error("Error listing migrations:", error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 },
    );
  }
}

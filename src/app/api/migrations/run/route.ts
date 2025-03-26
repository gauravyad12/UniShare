import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 },
      );
    }

    // Check if user is admin
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Failed to create admin client" },
        { status: 500 },
      );
    }

    // Get user session
    const {
      data: { session },
    } = await adminClient.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const { data: userProfile } = await adminClient
      .from("user_profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!userProfile || userProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin privileges required" },
        { status: 403 },
      );
    }

    // Get migration file from request body
    const { migrationFile } = await request.json();

    if (!migrationFile) {
      return NextResponse.json(
        { error: "Migration file path is required" },
        { status: 400 },
      );
    }

    // Validate file path to prevent directory traversal
    const normalizedPath = path.normalize(migrationFile);
    if (normalizedPath.includes("..") || !normalizedPath.endsWith(".sql")) {
      return NextResponse.json(
        { error: "Invalid migration file path" },
        { status: 400 },
      );
    }

    // Get the full path to the migration file
    const fullPath = path.join(process.cwd(), normalizedPath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: `Migration file not found: ${normalizedPath}` },
        { status: 404 },
      );
    }

    // Read the SQL file
    const sql = fs.readFileSync(fullPath, "utf8");

    // We already have the admin client from above

    // Execute the SQL
    const { data, error } = await adminClient.rpc("execute_sql", {
      query: sql,
    });

    if (error) {
      console.error("Migration error:", error);
      return NextResponse.json(
        { error: `Migration failed: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Migration ${path.basename(migrationFile)} executed successfully`,
      data,
    });
  } catch (error) {
    console.error("Unexpected error running migration:", error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 },
    );
  }
}

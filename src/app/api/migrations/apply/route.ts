import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

    // Get the migration file path from the request
    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: "Migration file path is required" },
        { status: 400 }
      );
    }

    // Read the migration file
    const fullPath = path.join(process.cwd(), filePath);
    const sql = fs.readFileSync(fullPath, "utf8");

    // Execute the SQL
    const { error } = await supabase.rpc("execute_sql", {
      query: sql
    });

    if (error) {
      console.error("Error executing migration:", error);
      return NextResponse.json(
        { error: `Failed to execute migration: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Migration ${filePath} applied successfully`
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}

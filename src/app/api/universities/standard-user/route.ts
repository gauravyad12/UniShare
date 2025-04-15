import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();

    // Check if Standard User university exists
    const { data, error } = await supabase
      .from("universities")
      .select("id, name")
      .eq("name", "Standard User");

    if (error) {
      console.error("Error checking for Standard User university:", error);
      return NextResponse.json(
        { exists: false, error: "Error checking university configuration" },
        { status: 500 }
      );
    }

    // Check if we found any rows
    const standardUserExists = Array.isArray(data) && data.length > 0;
    const standardUser = standardUserExists ? data[0] : null;

    console.log(`Standard User university exists: ${standardUserExists}`);
    if (standardUserExists) {
      console.log(`Found Standard User university: ID=${standardUser.id}, Name=${standardUser.name}`);
    }

    return NextResponse.json({
      exists: standardUserExists,
      university: standardUser ? { id: standardUser.id, name: standardUser.name } : null
    });

  } catch (error) {
    console.error("Error in standard-user check API:", error);
    return NextResponse.json(
      { exists: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

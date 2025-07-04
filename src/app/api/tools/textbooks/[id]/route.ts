import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { hasScholarPlusAccess } from '@/utils/supabase/subscription-check';

export const dynamic = "force-dynamic";

// GET: Get textbook details with chapters
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const textbookId = params.id;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has Scholar+ access (regular or temporary)
    const hasAccess = await hasScholarPlusAccess(user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Scholar+ subscription required" },
        { status: 403 }
      );
    }

    if (!textbookId) {
      return NextResponse.json(
        { error: "Textbook ID is required" },
        { status: 400 }
      );
    }

    // Get textbook details
    const { data: textbook, error: textbookError } = await supabase
      .from("textbooks")
      .select("*")
      .eq("id", textbookId)
      .single();

    if (textbookError) {
      console.error("Error fetching textbook:", textbookError);
      return NextResponse.json(
        { error: "Textbook not found" },
        { status: 404 }
      );
    }

    // Get chapters for this textbook
    const { data: chapters, error: chaptersError } = await supabase
      .from("textbook_chapters")
      .select("*")
      .eq("textbook_id", textbookId)
      .order("chapter_number");

    if (chaptersError) {
      console.error("Error fetching chapters:", chaptersError);
      return NextResponse.json(
        { error: "Failed to fetch chapters" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      textbook,
      chapters
    });
  } catch (error) {
    console.error("Error in textbook details API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { hasScholarPlusAccess } from '@/utils/supabase/subscription-check';

export const dynamic = "force-dynamic";

// GET: Get problems for a specific chapter
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const chapterId = params.id;

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

    if (!chapterId) {
      return NextResponse.json(
        { error: "Chapter ID is required" },
        { status: 400 }
      );
    }

    // Get problems for this chapter
    const { data: problems, error: problemsError } = await supabase
      .from("textbook_problems")
      .select("*")
      .eq("chapter_id", chapterId)
      .order("problem_number");

    if (problemsError) {
      console.error("Error fetching problems:", problemsError);
      return NextResponse.json(
        { error: "Failed to fetch problems" },
        { status: 500 }
      );
    }

    // Sort problems numerically
    const sortedProblems = [...problems].sort((a, b) => {
      // Try to convert to numbers first
      const aNumMatch = a.problem_number.match(/^(\d+)/);
      const bNumMatch = b.problem_number.match(/^(\d+)/);

      if (aNumMatch && bNumMatch) {
        const aNum = parseInt(aNumMatch[1]);
        const bNum = parseInt(bNumMatch[1]);
        if (aNum !== bNum) return aNum - bNum;
      }

      // Fall back to string comparison if not numeric or numbers are equal
      return a.problem_number.localeCompare(b.problem_number, undefined, {
        numeric: true,
        sensitivity: 'base'
      });
    });

    return NextResponse.json({
      problems: sortedProblems
    });
  } catch (error) {
    console.error("Error in problems API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 
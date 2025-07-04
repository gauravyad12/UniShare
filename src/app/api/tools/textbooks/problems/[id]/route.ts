import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { hasScholarPlusAccess } from '@/utils/supabase/subscription-check';

export const dynamic = "force-dynamic";

// GET: Get a specific problem with its solution
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const problemId = params.id;

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

    if (!problemId) {
      return NextResponse.json(
        { error: "Problem ID is required" },
        { status: 400 }
      );
    }

    // Get the problem details
    const { data: problem, error: problemError } = await supabase
      .from("textbook_problems")
      .select("*")
      .eq("id", problemId)
      .single();

    if (problemError) {
      console.error("Error fetching problem:", problemError);
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      problem
    });
  } catch (error) {
    console.error("Error in problem API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { hasScholarPlusAccess } from '@/utils/supabase/subscription-check';

export const dynamic = "force-dynamic";

// GET: Search textbooks
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

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

    const url = new URL(request.url);
    const query = url.searchParams.get("query") || "";
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const page = parseInt(url.searchParams.get("page") || "1");
    const offset = (page - 1) * limit;

    let supabaseQuery = supabase.from("textbooks").select("*", { count: "exact" });

    if (query) {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query}%,author.ilike.%${query}%,isbn.ilike.%${query}%`
      );
    }
    
    const { data, error, count } = await supabaseQuery
      .order("title")
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Failed to search textbooks:", error);
      return NextResponse.json(
        { error: "Failed to search textbooks" },
        { status: 500 }
      );
    }

    const response = {
      textbooks: data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in textbooks API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

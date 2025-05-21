import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Direct database connection for admin access
// Using SUPABASE_SERVICE_KEY instead of SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ncvinrzllkqlypnyluco.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || "",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Try to get subscription data directly
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    
    if (error) {
      console.error("Error querying subscriptions:", error);
      return NextResponse.json(
        { error: "Database query error" },
        { status: 500 }
      );
    }

    // Check if subscription is valid
    let hasScholarPlus = false;
    if (data) {
      const currentTime = Math.floor(Date.now() / 1000);
      hasScholarPlus = data.status === "active" &&
                      (!data.current_period_end ||
                       data.current_period_end > currentTime);
    }

    return NextResponse.json({
      hasScholarPlus
    });
  } catch (error) {
    console.error("Error in subscription status API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

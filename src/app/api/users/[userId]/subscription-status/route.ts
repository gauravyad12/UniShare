import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Direct database connection for admin access
// Using SUPABASE_SERVICE_KEY instead of SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
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

    // Use the enhanced stored procedure that checks both regular and temporary access
    const { data: hasAccess, error: procedureError } = await supabaseAdmin
      .rpc('has_scholar_plus_access', { p_user_id: userId });

    if (procedureError) {
      console.error("Error calling has_scholar_plus_access:", procedureError);
      
      // Fallback to manual checks
      let hasScholarPlus = false;
      
      // Check regular subscription
      const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();
      
      if (!subscriptionError && subscriptionData) {
        const currentTime = Math.floor(Date.now() / 1000);
        hasScholarPlus = subscriptionData.status === "active" &&
                        (!subscriptionData.current_period_end ||
                         subscriptionData.current_period_end > currentTime);
      }

      // Check temporary access if no regular subscription
      if (!hasScholarPlus) {
        const { data: temporaryAccess, error: temporaryError } = await supabaseAdmin
          .from("temporary_scholar_access")
          .select("expires_at")
          .eq("user_id", userId)
          .eq("is_active", true)
          .gt("expires_at", new Date().toISOString())
          .limit(1)
          .maybeSingle();

        if (!temporaryError && temporaryAccess) {
          hasScholarPlus = true;
        }
      }

      return NextResponse.json({
        hasScholarPlus
      });
    }

    return NextResponse.json({
      hasScholarPlus: hasAccess || false
    });
  } catch (error) {
    console.error("Error in subscription status API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

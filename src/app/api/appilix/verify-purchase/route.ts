import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createUserClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { code, productId, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters: code, userId" },
        { status: 400 }
      );
    }

    // Use environment variables with fallbacks
    const monthlyProductId = process.env.NEXT_PUBLIC_APPILIX_MONTHLY_PRODUCT_ID;
    const yearlyProductId = process.env.NEXT_PUBLIC_APPILIX_YEARLY_PRODUCT_ID;
    
    if (!monthlyProductId || !yearlyProductId) {
      console.error("Missing Appilix product IDs in environment variables");
      return NextResponse.json(
        { error: "Server configuration error: Missing product IDs" },
        { status: 500 }
      );
    }
    
    const finalProductId = productId || monthlyProductId;

    // Verify the security code against the environment variable
    const expectedCode = process.env.APPILIX_PRODUCT_PURCHASE_CODE;

    if (!expectedCode) {
      console.error("APPILIX_PRODUCT_PURCHASE_CODE not set in environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Allow test codes in development
    const isTestCode = code.startsWith('test_purchase_code_');
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!isTestCode && code !== expectedCode) {
      console.error("Invalid Appilix purchase code provided");
      return NextResponse.json(
        { error: "Invalid purchase code" },
        { status: 401 }
      );
    }

    // In development, allow test codes to proceed
    if (isTestCode && !isDevelopment) {
      return NextResponse.json(
        { error: "Test codes only allowed in development" },
        { status: 401 }
      );
    }

    // Initialize user client for authentication
    const userSupabase = createUserClient();

    // Check required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl) {
      console.error("NEXT_PUBLIC_SUPABASE_URL not set in environment variables");
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase URL" },
        { status: 500 }
      );
    }

    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_KEY not set in environment variables");
      return NextResponse.json(
        { error: "Server configuration error: Missing service role key" },
        { status: 500 }
      );
    }

    // Initialize service client for database operations
    const serviceSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the user is authenticated and matches the provided userId
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();

    if (userError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: "User authentication failed" },
        { status: 401 }
      );
    }

    // Determine subscription details based on product ID
    let interval = "month";
    let amount = 299; // Default to monthly amount
    let priceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;
    
    if (!priceId) {
      console.error("Missing Stripe price IDs in environment variables");
      return NextResponse.json(
        { error: "Server configuration error: Missing Stripe price IDs" },
        { status: 500 }
      );
    }
    
    if (finalProductId === monthlyProductId) {
      interval = "month";
      amount = 299; // $2.99 in cents
      priceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;
    } else if (finalProductId === yearlyProductId) {
      interval = "year";
      amount = 2499; // $24.99 in cents
      priceId = process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID;
    }
    
    if (!priceId) {
      console.error("Missing Stripe price ID for selected interval");
      return NextResponse.json(
        { error: "Server configuration error: Missing price ID" },
        { status: 500 }
      );
    }

    // Create a subscription record for the Appilix purchase
    const currentTime = Math.floor(Date.now() / 1000);

    // Check if user already has an active subscription using service client
    const { data: existingSubscription } = await serviceSupabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (existingSubscription) {
      // For renewals, extend from the current period end date, not from now
      const extensionStartTime = existingSubscription.current_period_end > currentTime
        ? existingSubscription.current_period_end  // Extend from current end if still active
        : currentTime; // Start from now if subscription has already expired

      const periodEnd = interval === "month"
        ? extensionStartTime + (30 * 24 * 60 * 60) // 30 days from extension start
        : extensionStartTime + (365 * 24 * 60 * 60); // 365 days from extension start

      // Update existing subscription using service client
      const { error: updateError } = await serviceSupabase
        .from("subscriptions")
        .update({
          stripe_id: `appilix_${finalProductId}_${Date.now()}`, // Unique identifier for Appilix purchases
          status: "active",
          current_period_start: existingSubscription.current_period_start, // Keep original start date
          current_period_end: periodEnd, // Extend the end date
          cancel_at_period_end: false,
          amount: amount,
          interval: interval,
          currency: "usd",
          updated_at: new Date().toISOString(),
          metadata: JSON.stringify({
            source: "appilix",
            product_id: finalProductId,
            purchase_code: code,
            renewal_date: new Date().toISOString()
          })
        })
        .eq("id", existingSubscription.id);

      if (updateError) {
        console.error("Error updating subscription:", updateError);
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        );
      }
    } else {
      // Create new subscription using service client
      const periodEnd = interval === "month"
        ? currentTime + (30 * 24 * 60 * 60) // 30 days from now
        : currentTime + (365 * 24 * 60 * 60); // 365 days from now

      const { error: insertError } = await serviceSupabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          stripe_id: `appilix_${finalProductId}_${Date.now()}`, // Unique identifier for Appilix purchases
          customer_id: `appilix_customer_${userId}`, // Appilix customer identifier
          status: "active",
          current_period_start: currentTime,
          current_period_end: periodEnd,
          cancel_at_period_end: false,
          amount: amount,
          interval: interval,
          currency: "usd",
          updated_at: new Date().toISOString(),
          metadata: JSON.stringify({
            source: "appilix",
            product_id: finalProductId,
            purchase_code: code
          })
        });

      if (insertError) {
        console.error("Error creating subscription:", insertError);
        return NextResponse.json(
          { error: "Failed to create subscription" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Purchase verified and subscription activated"
    });

  } catch (error) {
    console.error("Error verifying Appilix purchase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

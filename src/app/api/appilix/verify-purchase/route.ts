import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { code, productId, userId } = await request.json();

    if (!code || !productId || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters: code, productId, userId" },
        { status: 400 }
      );
    }

    // Verify the security code against the environment variable
    const expectedCode = process.env.APPILIX_PRODUCT_PURCHASE_CODE;

    if (!expectedCode) {
      console.error("APPILIX_PRODUCT_PURCHASE_CODE not set in environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (code !== expectedCode) {
      console.error("Invalid Appilix purchase code provided");
      return NextResponse.json(
        { error: "Invalid purchase code" },
        { status: 401 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient();

    // Verify the user exists
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user || userData.user.id !== userId) {
      return NextResponse.json(
        { error: "User authentication failed" },
        { status: 401 }
      );
    }

    // Determine subscription details based on product ID
    let interval: string;
    let amount: number;

    if (productId === "com.unishare.app.scholarplusonemonth") {
      interval = "month";
      amount = 299; // $2.99 in cents
    } else if (productId === "com.unishare.app.scholarplusoneyear") {
      interval = "year";
      amount = 2499; // $24.99 in cents
    } else {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Create a subscription record for the Appilix purchase
    const currentTime = Math.floor(Date.now() / 1000);
    const periodEnd = interval === "month"
      ? currentTime + (30 * 24 * 60 * 60) // 30 days
      : currentTime + (365 * 24 * 60 * 60); // 365 days

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          stripe_id: `appilix_${productId}_${Date.now()}`, // Unique identifier for Appilix purchases
          status: "active",
          current_period_start: currentTime,
          current_period_end: periodEnd,
          cancel_at_period_end: false,
          amount: amount,
          interval: interval,
          currency: "usd",
          metadata: JSON.stringify({
            source: "appilix",
            product_id: productId,
            purchase_code: code
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
      // Create new subscription
      const { error: insertError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          stripe_id: `appilix_${productId}_${Date.now()}`, // Unique identifier for Appilix purchases
          customer_id: `appilix_customer_${userId}`, // Appilix customer identifier
          status: "active",
          current_period_start: currentTime,
          current_period_end: periodEnd,
          cancel_at_period_end: false,
          amount: amount,
          interval: interval,
          currency: "usd",
          metadata: JSON.stringify({
            source: "appilix",
            product_id: productId,
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

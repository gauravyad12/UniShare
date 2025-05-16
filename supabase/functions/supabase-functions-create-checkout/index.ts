// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/supabase-functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@12.18.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-customer-email",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Starting checkout session creation process");

    // Log request headers for debugging
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));

    // Get the request body
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body));

    const { price_id, user_id, return_url } = body;
    console.log(`Extracted values - price_id: ${price_id}, user_id: ${user_id}, return_url: ${return_url}`);

    // Validate required fields
    if (!price_id) {
      console.error("Missing required field: price_id");
      return new Response(
        JSON.stringify({ error: "Price ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user_id) {
      console.error("Missing required field: user_id");
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get customer email from headers
    const customerEmail = req.headers.get("X-Customer-Email") || "";
    console.log(`Customer email from headers: ${customerEmail}`);

    // Initialize Supabase client
    console.log("Initializing Supabase client");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      console.log(`SUPABASE_URL exists: ${!!supabaseUrl}, SUPABASE_SERVICE_ROLE_KEY exists: ${!!supabaseKey}`);
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client initialized");

    // Initialize Stripe
    console.log("Initializing Stripe client");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";

    if (!stripeSecretKey) {
      console.error("Missing Stripe environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
    console.log("Stripe client initialized");

    // Get user profile
    console.log(`Fetching user profile for user_id: ${user_id}`);
    const { data: userProfile, error: userError } = await supabase
      .from("user_profiles")
      .select("full_name, username")
      .eq("id", user_id)
      .single();

    if (userError) {
      console.error("Error fetching user profile:", userError);
    } else {
      console.log("User profile fetched:", userProfile);
    }

    // Check if customer already exists
    console.log(`Checking if customer already exists for user_id: ${user_id}`);
    let customerId;
    const { data: existingSubscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("customer_id")
      .eq("user_id", user_id)
      .maybeSingle();

    if (subscriptionError) {
      console.error("Error checking existing subscription:", subscriptionError);
    }

    if (existingSubscription?.customer_id) {
      customerId = existingSubscription.customer_id;
      console.log(`Using existing customer ID: ${customerId}`);
    } else {
      console.log("No existing customer found, creating new customer");
      try {
        // Create a new customer
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: userProfile?.full_name || undefined,
          metadata: {
            user_id,
            username: userProfile?.username || "",
          },
        });
        customerId = customer.id;
        console.log(`Created new customer with ID: ${customerId}`);
      } catch (stripeError: any) {
        console.error("Error creating Stripe customer:", stripeError);
        console.error("Stripe error details:", JSON.stringify(stripeError, Object.getOwnPropertyNames(stripeError)));
        return new Response(
          JSON.stringify({
            error: `Error creating customer: ${stripeError.message || "Unknown Stripe error"}`,
            stripeErrorType: stripeError.type || "unknown",
            stripeErrorCode: stripeError.code || "unknown"
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create a checkout session
    console.log(`Creating checkout session with price_id: ${price_id}, customer_id: ${customerId}`);
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: price_id,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${return_url}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${return_url}/cancel`,
        metadata: {
          user_id,
        },
        subscription_data: {
          metadata: {
            user_id,
          },
        },
      });

      console.log("Checkout session created successfully:", session.id);

      // Return the checkout URL
      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (stripeError: any) {
      console.error("Error creating checkout session:", stripeError);
      console.error("Stripe checkout error details:", JSON.stringify(stripeError, Object.getOwnPropertyNames(stripeError)));
      return new Response(
        JSON.stringify({
          error: `Error creating checkout session: ${stripeError.message || "Unknown Stripe error"}`,
          stripeErrorType: stripeError.type || "unknown",
          stripeErrorCode: stripeError.code || "unknown"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Unhandled error in checkout function:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));

    return new Response(
      JSON.stringify({
        error: error.message || "Unknown error occurred",
        errorType: error.constructor.name,
        errorCode: error.code || "UNKNOWN"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

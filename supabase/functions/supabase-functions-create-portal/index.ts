// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/supabase-functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@12.18.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Received portal creation request");

    // Get the request body
    const { customer_id, user_id, return_url } = await req.json();
    console.log(`Request data - user_id: ${user_id}, customer_id: ${customer_id}`);

    // Validate required fields
    if (!customer_id) {
      console.error("Missing customer_id in request");
      return new Response(
        JSON.stringify({ error: "Customer ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user_id) {
      console.error("Missing user_id in request");
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Verify that the customer belongs to the user
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("customer_id")
      .eq("user_id", user_id)
      .eq("customer_id", customer_id);

    // Check if we got any results (not using .single() to handle multiple subscriptions)
    if (subscriptionError || !subscriptionData || subscriptionData.length === 0) {
      console.error("Error verifying customer:", subscriptionError);
      return new Response(
        JSON.stringify({ error: "Customer not found or does not belong to user" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If we get here, we found at least one matching subscription, so the customer ID is valid for this user

    // Create a Stripe customer portal session
    console.log(`Creating Stripe portal session for customer: ${customer_id}`);
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customer_id,
        return_url: return_url || "https://unishare.app/dashboard/settings",
      });

      console.log("Portal session created successfully");

      // Return the portal URL
      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (stripeError) {
      console.error("Stripe error creating portal session:", stripeError);
      return new Response(
        JSON.stringify({
          error: "Error creating Stripe portal session",
          details: stripeError.message
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in portal creation function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "No stack trace";
    console.error("Error stack:", errorStack);

    return new Response(
      JSON.stringify({ error: "Error creating portal session", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

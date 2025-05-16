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
    // Get the request body
    const { subscription_id, user_id } = await req.json();

    // Validate required fields
    if (!subscription_id) {
      return new Response(
        JSON.stringify({ error: "Subscription ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user_id) {
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

    // Verify that the subscription belongs to the user
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("stripe_id")
      .eq("user_id", user_id)
      .eq("stripe_id", subscription_id)
      .single();

    if (subscriptionError || !subscriptionData) {
      console.error("Error verifying subscription:", subscriptionError);
      return new Response(
        JSON.stringify({ error: "Subscription not found or does not belong to user" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cancel the subscription at the end of the current period
    const updatedSubscription = await stripe.subscriptions.update(subscription_id, {
      cancel_at_period_end: true,
    });

    // Update the subscription in Supabase
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        canceled_at: Math.floor(Date.now() / 1000),
      })
      .eq("stripe_id", subscription_id);

    if (updateError) {
      console.error("Error updating subscription in Supabase:", updateError);
    }

    // Return success
    return new Response(
      JSON.stringify({ success: true, subscription: updatedSubscription }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/supabase-functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@12.18.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Received webhook request");

    // Get the Stripe signature from the request headers
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("Missing Stripe signature");
      return new Response(
        JSON.stringify({ error: "Missing Stripe signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request body as text
    const body = await req.text();
    console.log("Received webhook body");

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

    if (!stripeSecretKey || !stripeWebhookSecret) {
      console.error("Missing Stripe environment variables");
      console.log(`STRIPE_SECRET_KEY exists: ${!!stripeSecretKey}, STRIPE_WEBHOOK_SECRET exists: ${!!stripeWebhookSecret}`);
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
    console.log("Stripe initialized");

    // Verify the webhook signature
    let event;
    try {
      console.log("Verifying webhook signature");
      // Use the asynchronous version of constructEvent
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
      console.log(`Webhook verified: ${event.type}`);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
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

    // Log the webhook event
    console.log(`Logging webhook event: ${event.type}`);
    const { data: webhookData, error: webhookError } = await supabase.from("webhook_events").insert({
      event_type: event.type,
      type: "stripe",
      stripe_event_id: event.id,
      data: event.data,
    }).select();

    if (webhookError) {
      console.error("Error logging webhook event:", webhookError);
    } else {
      console.log("Webhook event logged successfully");
    }

    // Handle the event based on its type
    console.log(`Processing event type: ${event.type}`);
    switch (event.type) {
      case "checkout.session.completed": {
        console.log("Processing checkout.session.completed event");
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        console.log(`Session details - userId: ${userId}, customerId: ${customerId}, subscriptionId: ${subscriptionId}`);

        if (!userId || !subscriptionId) {
          console.error(`Missing required data - userId: ${userId}, subscriptionId: ${subscriptionId}`);
          break;
        }

        try {
          // Get subscription details from Stripe
          console.log(`Retrieving subscription details from Stripe: ${subscriptionId}`);
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0].price.id;
          console.log(`Retrieved subscription - priceId: ${priceId}, status: ${subscription.status}`);

          // First, check if this subscription already exists
          console.log(`Checking if subscription ${subscriptionId} already exists`);
          const { data: existingSubscription, error: lookupError } = await supabase
            .from("subscriptions")
            .select("id, status")
            .eq("stripe_id", subscriptionId)
            .maybeSingle();

          if (lookupError) {
            console.error(`Error checking for existing subscription: ${lookupError.message}`);
          }

          // If the subscription exists, update it
          if (existingSubscription) {
            console.log(`Subscription ${subscriptionId} already exists with status: ${existingSubscription.status}`);

            // Update the existing subscription
            console.log(`Updating existing subscription ${subscriptionId}`);
            const { error: updateError } = await supabase
              .from("subscriptions")
              .update({
                status: subscription.status,
                price_id: priceId,
                stripe_price_id: priceId,
                current_period_start: subscription.current_period_start,
                current_period_end: subscription.current_period_end,
                cancel_at_period_end: subscription.cancel_at_period_end,
                amount: subscription.items.data[0].price.unit_amount,
                interval: subscription.items.data[0].price.recurring.interval,
                currency: subscription.currency,
                metadata: subscription.metadata,
                updated_at: new Date().toISOString()
              })
              .eq("stripe_id", subscriptionId);

            if (updateError) {
              console.error(`Error updating subscription: ${updateError.message}`);
            } else {
              console.log(`Successfully updated subscription ${subscriptionId}`);
            }
          } else {
            // For any new subscription, we'll use the transaction function to replace any existing subscriptions
            console.log(`Handling subscription for user ${userId} using transaction`);

            // Use a transaction to delete any existing subscriptions and create a new one
            const { error: transactionError } = await supabase.rpc('handle_new_subscription', {
              p_user_id: userId,
              p_stripe_id: subscriptionId,
              p_price_id: priceId,
              p_status: subscription.status,
              p_customer_id: customerId,
              p_current_period_start: subscription.current_period_start,
              p_current_period_end: subscription.current_period_end,
              p_cancel_at_period_end: subscription.cancel_at_period_end,
              p_amount: subscription.items.data[0].price.unit_amount,
              p_interval: subscription.items.data[0].price.recurring.interval,
              p_currency: subscription.currency,
              p_metadata: JSON.stringify(subscription.metadata || {})
            });

            if (transactionError) {
              console.error(`Transaction error handling subscription: ${transactionError.message}`);

              // If the transaction fails, we'll try the manual approach as a fallback
              console.log(`Fallback: Manually handling subscription for user ${userId}`);

              // First delete any existing subscriptions
              const { error: deleteError } = await supabase
                .from("subscriptions")
                .delete()
                .eq("user_id", userId);

              if (deleteError) {
                console.error(`Error deleting existing subscriptions: ${deleteError.message}`);
                console.log(`Critical error: Unable to delete existing subscriptions. New subscription creation may fail.`);
              } else {
                console.log(`Successfully deleted existing subscriptions for user ${userId}`);
              }

              // Then create the new subscription
              console.log(`Creating new subscription for ${subscriptionId}`);
              const { error: insertError } = await supabase
                .from("subscriptions")
                .insert({
                  user_id: userId,
                  stripe_id: subscriptionId,
                  price_id: priceId,
                  stripe_price_id: priceId,
                  status: subscription.status,
                  customer_id: customerId,
                  current_period_start: subscription.current_period_start,
                  current_period_end: subscription.current_period_end,
                  cancel_at_period_end: subscription.cancel_at_period_end,
                  amount: subscription.items.data[0].price.unit_amount,
                  interval: subscription.items.data[0].price.recurring.interval,
                  currency: subscription.currency,
                  metadata: subscription.metadata,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });

              if (insertError) {
                console.error(`Error creating subscription: ${insertError.message}`);
              } else {
                console.log(`Successfully created subscription ${subscriptionId}`);
              }
            } else {
              console.log(`Successfully handled subscription via transaction for user ${userId}`);
            }
          }
        } catch (err) {
          console.error(`Error processing checkout.session.completed: ${err instanceof Error ? err.message : String(err)}`);
        }
        break;
      }
      case "customer.subscription.updated": {
        console.log("Processing customer.subscription.updated event");
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;

        console.log(`Subscription details - userId: ${userId}, subscriptionId: ${subscription.id}`);

        if (userId) {
          // Update subscription in Supabase
          console.log("Upserting subscription in Supabase");
          const { data: subscriptionData, error } = await supabase.from("subscriptions").upsert({
            user_id: userId,
            stripe_id: subscription.id,
            price_id: subscription.items.data[0].price.id,
            stripe_price_id: subscription.items.data[0].price.id,
            status: subscription.status,
            customer_id: subscription.customer,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            amount: subscription.items.data[0].price.unit_amount,
            interval: subscription.items.data[0].price.recurring.interval,
            currency: subscription.currency,
            metadata: subscription.metadata,
          }).select();

          if (error) {
            console.error("Error upserting subscription:", error);
          } else {
            console.log("Subscription upserted successfully:", subscriptionData);
          }
        } else {
          console.error(`Missing required data - userId: ${userId}`);
        }
        break;
      }
      case "customer.subscription.deleted": {
        console.log("Processing customer.subscription.deleted event");
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;

        console.log(`Subscription details - userId: ${userId}, subscriptionId: ${subscription.id}`);

        if (userId) {
          // Update subscription status in Supabase
          console.log("Updating subscription status in Supabase");
          const { data: subscriptionData, error } = await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              ended_at: Math.floor(Date.now() / 1000),
            })
            .eq("stripe_id", subscription.id)
            .select();

          if (error) {
            console.error("Error updating subscription:", error);
          } else {
            console.log("Subscription updated successfully:", subscriptionData);
          }
        } else {
          console.error(`Missing required data - userId: ${userId}`);
        }
        break;
      }
      default: {
        console.log(`Unhandled event type: ${event.type}`);
      }
    }

    // Return a success response
    console.log("Webhook processed successfully");
    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error handling webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "No stack trace";
    console.error("Error stack:", errorStack);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

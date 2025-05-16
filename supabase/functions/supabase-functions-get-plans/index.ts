// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/supabase-functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Define the pricing plans
    const pricingPlans = [
      {
        id: "free",
        name: "Free",
        amount: 0,
        interval: "month",
        popular: false,
        features: [
          { name: "Access to public resources", included: true },
          { name: "Join study groups", included: true },
          { name: "Limited resource uploads (5/month)", included: true },
          { name: "Basic profile customization", included: true },
          { name: "Create up to 2 study groups", included: true },
          { name: "Limited AI Tools (3 uses/month)", included: true, iconName: "Sparkles" },
          { name: "Textbook Solutions", included: false },
          { name: "Proxy Browser", included: false },
          { name: "Degree Roadmap Sharing", included: false },
        ],
      },
      {
        id: "price_scholar_plus_monthly",
        name: "Scholar+",
        amount: 299,
        interval: "month",
        popular: true,
        badge: "Recommended",
        yearlyPrice: 2499,
        yearlyInterval: "year",
        features: [
          { name: "All Free features", included: true },
          { name: "Unlimited resource uploads", included: true },
          { name: "Create unlimited study groups", included: true },
          { name: "Advanced profile customization", included: true },
          { name: "AI Essay Writer", included: true, iconName: "FileText" },
          { name: "AI Document Chat & Analysis", included: true, iconName: "MessageSquare" },
          { name: "AI Lecture Note Taker", included: true, iconName: "Mic" },
          { name: "Textbook Solutions", included: true, iconName: "BookMarked" },
          { name: "Proxy Browser", included: true, iconName: "Globe" },
          { name: "Degree Roadmap Sharing", included: true, iconName: "BarChart3" },
        ],
      }
    ];

    // Try to get the actual prices from Stripe
    try {
      const prices = await stripe.prices.list({
        active: true,
        expand: ["data.product"],
        limit: 10,
      });

      // Map Stripe prices to our pricing plans
      if (prices.data.length > 0) {
        // Find the monthly Scholar+ price
        const scholarPlusMonthly = prices.data.find(
          (price) => 
            price.nickname === "Scholar+ Monthly" || 
            price.product.name === "Scholar+ Monthly"
        );

        // Find the yearly Scholar+ price
        const scholarPlusYearly = prices.data.find(
          (price) => 
            price.nickname === "Scholar+ Yearly" || 
            price.product.name === "Scholar+ Yearly"
        );

        // Update the pricing plans with actual Stripe prices
        if (scholarPlusMonthly) {
          pricingPlans[1].id = scholarPlusMonthly.id;
          pricingPlans[1].amount = scholarPlusMonthly.unit_amount || 299;
        }

        if (scholarPlusYearly) {
          pricingPlans[1].yearlyPrice = scholarPlusYearly.unit_amount || 2499;
        }
      }
    } catch (stripeError) {
      console.error("Error fetching Stripe prices:", stripeError);
      // Continue with hardcoded prices
    }

    // Return the pricing plans
    return new Response(
      JSON.stringify(pricingPlans),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error getting pricing plans:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

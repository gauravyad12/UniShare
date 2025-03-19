import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_KEY") ?? "",
    );

    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Extract domain from email
    const domain = email.split("@")[1];
    if (!domain) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if the domain exists in our universities table
    const { data: universityData, error: universityError } =
      await supabaseClient
        .from("universities")
        .select("id, name, domain")
        .eq("domain", domain)
        .single();

    if (universityError || !universityData) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Your university email domain is not supported",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Still return 200 but with valid: false
        },
      );
    }

    // Check if user with this email already exists
    const { data: existingUser, error: existingUserError } =
      await supabaseClient.auth.admin
        .getUserByEmail(email)
        .catch(() => ({ data: null, error: null }));

    if (existingUser) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "An account with this email already exists",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        university: {
          id: universityData.id,
          name: universityData.name,
          domain: universityData.domain,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

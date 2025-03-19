// This is a JavaScript version of the Edge Function
// Sometimes TypeScript files can cause issues with deployment

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
    console.log("Creating Supabase client with service role key");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_KEY") ?? "",
    );

    console.log("Supabase client created successfully");

    const body = await req.json();
    console.log("Request body:", body);

    const { inviteCode } = body;

    if (!inviteCode) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invite code is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Check if the invite code exists and is valid
    const { data: inviteData, error: inviteError } = await supabaseClient
      .from("invite_codes")
      .select(
        "id, code, university_id, is_active, max_uses, current_uses, expires_at, universities!invite_codes_university_id_fkey(domain)",
      )
      .ilike("code", inviteCode) // Case-insensitive matching
      .single();

    if (inviteError || !inviteData) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid invite code" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Using 200 to handle this on the client side
        },
      );
    }

    // Check if invite code is active
    if (!inviteData.is_active) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Invite code is no longer active",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // Check if invite code has reached max uses
    if (
      inviteData.max_uses > 0 &&
      inviteData.current_uses >= inviteData.max_uses
    ) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Invite code has reached maximum usage limit",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // Check if invite code has expired
    if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invite code has expired" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // Get university information from the joined data
    const universityDomain = inviteData.universities?.domain;

    return new Response(
      JSON.stringify({
        valid: true,
        university_id: inviteData.university_id,
        invite_code_id: inviteData.id,
        university_domain: universityDomain,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ valid: false, error: "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

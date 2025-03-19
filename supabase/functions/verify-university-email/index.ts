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

    const { email, inviteCode } = await req.json();

    if (!email || !inviteCode) {
      return new Response(
        JSON.stringify({ error: "Email and invite code are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Extract domain from email
    const domain = email.split("@")[1];
    if (!domain) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if the invite code exists and is valid
    const { data: inviteData, error: inviteError } = await supabaseClient
      .from("invite_codes")
      .select(
        "id, code, university_id, is_active, max_uses, current_uses, expires_at",
      )
      .eq("code", inviteCode)
      .single();

    if (inviteError || !inviteData) {
      return new Response(JSON.stringify({ error: "Invalid invite code" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if invite code is active
    if (!inviteData.is_active) {
      return new Response(
        JSON.stringify({ error: "Invite code is no longer active" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
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
          error: "Invite code has reached maximum usage limit",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Check if invite code has expired
    if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Invite code has expired" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Get university information
    const { data: universityData, error: universityError } =
      await supabaseClient
        .from("universities")
        .select("id, domain")
        .eq("id", inviteData.university_id)
        .single();

    if (universityError || !universityData) {
      return new Response(JSON.stringify({ error: "University not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verify that email domain matches university domain
    if (domain !== universityData.domain) {
      return new Response(
        JSON.stringify({
          error: `Email domain must be ${universityData.domain} for this invite code`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Increment the invite code usage
    const { error: updateError } = await supabaseClient
      .from("invite_codes")
      .update({ current_uses: inviteData.current_uses + 1 })
      .eq("id", inviteData.id);

    if (updateError) {
      console.error("Error updating invite code usage:", updateError);
    }

    return new Response(
      JSON.stringify({
        valid: true,
        university_id: universityData.id,
        invite_code_id: inviteData.id,
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

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
    // Parse request body only once to avoid potential issues
    const requestData = await req.json().catch(() => ({}));
    const { email } = requestData;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Extract domain from email and convert to lowercase
    const emailParts = email.split("@");
    if (emailParts.length < 2 || !emailParts[1]) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const domain = emailParts[1].toLowerCase();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_KEY") ?? "",
    );

    // Get all universities to check for matching domains
    const { data: universities, error: universityError } = await supabaseClient
      .from("universities")
      .select("id, name, domain");

    if (universityError) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Error checking university domains",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Find university with matching domain (case-insensitive, handling spaces after commas)
    console.log(`Checking email domain in edge function: ${domain}`);

    // Debug: Log all universities and their domains
    universities?.forEach((uni) => {
      console.log(
        `University in edge function: ${uni.name}, Domains: ${uni.domain}`,
      );
    });

    const universityData = universities?.find((university) => {
      if (!university.domain) return false;
      const domains = university.domain
        .split(",")
        .map((d) => d.trim().toLowerCase());
      const matches = domains.includes(domain);
      console.log(
        `Checking ${university.name} in edge function: domains=${domains.join("|")}, match=${matches}`,
      );
      return matches;
    });

    // Common email domains like icloud.com should be supported
    const commonDomains = [
      "gmail.com",
      "outlook.com",
      "hotmail.com",
      "yahoo.com",
      "icloud.com",
    ];

    if (!universityData && !commonDomains.includes(domain)) {
      return new Response(
        JSON.stringify({
          valid: false,
          error:
            "Your email domain or university is not supported. Please contact support.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Still return 200 but with valid: false
        },
      );
    }

    // If no university matched but it's a common domain, use the General Users university
    const universityToUse =
      universityData ||
      universities?.find(
        (u) =>
          u.name === "General Users" ||
          u.domain.toLowerCase().includes("gmail.com") ||
          u.domain.toLowerCase().includes("icloud.com"),
      );

    if (!universityToUse) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Could not find appropriate university for your email",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // Check if user with this email already exists
    let existingUser = null;
    let responseData;
    let responseStatus = 200;

    try {
      const { data } = await supabaseClient.auth.admin.getUserByEmail(email);
      existingUser = data;
    } catch (err) {
      // Ignore error, treat as no existing user
      console.error("Error checking existing user:", err);
    }

    if (existingUser) {
      responseData = {
        valid: false,
        error: "An account with this email already exists",
      };
    } else {
      responseData = {
        valid: true,
        university: {
          id: universityData.id,
          name: universityData.name,
          domain: universityData.domain,
        },
      };
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: responseStatus,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Connect to Canvas API
export async function POST(request: NextRequest) {
  console.log("\n[Canvas API] Connecting to Canvas...");
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[Canvas API] Error: Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domain, accessToken } = await request.json();
    console.log(`[Canvas API] Received connection request for domain: ${domain}`);
    console.log(`[Canvas API] Access token provided: ${accessToken.substring(0, 5)}...`);

    if (!domain || !accessToken) {
      console.log("[Canvas API] Error: Missing domain or access token");
      return NextResponse.json(
        { error: "Domain and access token are required" },
        { status: 400 }
      );
    }

    // Clean up domain (remove protocol and trailing slashes)
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    console.log(`[Canvas API] Cleaned domain: ${cleanDomain}`);

    // Validate the access token by making a test request to Canvas API
    try {
      console.log(`[Canvas API] Validating access token with Canvas API...`);
      const validationResponse = await fetch(
        `https://${cleanDomain}/api/v1/users/self/profile`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log(`[Canvas API] Validation response status: ${validationResponse.status}`);

      if (!validationResponse.ok) {
        const errorText = await validationResponse.text();
        console.log(`[Canvas API] Validation error: ${errorText}`);
        return NextResponse.json(
          { error: `Invalid access token: ${validationResponse.status} ${errorText}` },
          { status: 400 }
        );
      }

      const profile = await validationResponse.json();
      console.log(`[Canvas API] Successfully validated token for user: ${profile.name}`);
    } catch (validationError: any) {
      console.error("[Canvas API] Error validating access token:", validationError);

      // Provide more specific error messages based on the error type
      let errorMessage = "Could not validate access token. Please check your domain and token.";

      // Check for network errors
      if (validationError.cause) {
        if (validationError.cause.code === 'ENOTFOUND') {
          errorMessage = `Domain not found: ${validationError.cause.hostname}. Please check the domain name.`;
        } else if (validationError.cause.code === 'ECONNREFUSED') {
          errorMessage = `Connection refused to ${validationError.cause.address}. The Canvas server may be down or not accepting connections.`;
        } else if (validationError.cause.code) {
          errorMessage = `Network error (${validationError.cause.code}): ${validationError.cause.message}`;
        }
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // Check if user already has a Canvas integration
    const { data: existingIntegration } = await supabase
      .from("user_canvas_integrations")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingIntegration) {
      console.log(`[Canvas API] Updating existing integration for user: ${user.id}`);
      // Update existing integration
      const { data, error } = await supabase
        .from("user_canvas_integrations")
        .update({
          domain: cleanDomain,
          access_token: accessToken,
          is_connected: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select();

      if (error) {
        console.error("[Canvas API] Error updating Canvas integration:", error);
        return NextResponse.json(
          { error: "Failed to update Canvas integration" },
          { status: 500 }
        );
      }

      console.log(`[Canvas API] Successfully updated Canvas integration`);
      return NextResponse.json({
        success: true,
        message: "Canvas integration updated",
        integration: data[0],
      });
    } else {
      console.log(`[Canvas API] Creating new integration for user: ${user.id}`);
      // Create new integration
      const { data, error } = await supabase
        .from("user_canvas_integrations")
        .insert({
          user_id: user.id,
          domain: cleanDomain,
          access_token: accessToken,
          is_connected: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        console.error("[Canvas API] Error creating Canvas integration:", error);
        return NextResponse.json(
          { error: "Failed to create Canvas integration" },
          { status: 500 }
        );
      }

      console.log(`[Canvas API] Successfully created Canvas integration`);
      return NextResponse.json({
        success: true,
        message: "Canvas integration created",
        integration: data[0],
      });
    }
  } catch (error) {
    console.error("[Canvas API] Error connecting to Canvas:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

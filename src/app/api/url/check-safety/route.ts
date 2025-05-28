import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Authentication check - accessible to all authenticated users
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Get the API key from environment variables
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

    if (!apiKey) {
      console.error("Google Safe Browsing API key is not configured");
      // Return safe if API key is not configured to avoid blocking legitimate content
      return NextResponse.json({ isSafe: true });
    }

    // Call Google Safe Browsing API
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "unishare", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Error from Google Safe Browsing API:", await response.text());
      // Return safe if API call fails to avoid blocking legitimate content
      return NextResponse.json({ isSafe: true });
    }

    const data = await response.json();

    // If matches are found, the URL is unsafe
    if (data.matches && data.matches.length > 0) {
      const threat = data.matches[0];
      return NextResponse.json({
        isSafe: false,
        threatType: threat.threatType,
        platformType: threat.platformType,
        threatEntryType: threat.threatEntryType,
      });
    }

    // No matches found, URL is safe
    return NextResponse.json({ isSafe: true });
  } catch (error) {
    console.error("Error checking URL safety:", error);
    // Return safe if there's an error to avoid blocking legitimate content
    return NextResponse.json({ isSafe: true });
  }
}

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { domain, checkBadWords, username } = requestData;

    const supabase = createClient();

    // Check for bad words in username
    if (checkBadWords && username) {
      // Get bad words from database
      const { data: badWords, error: badWordsError } = await supabase
        .from("bad_words")
        .select("word");

      if (badWordsError) {
        console.error("Error fetching bad words:", badWordsError);
        return NextResponse.json(
          { valid: false, error: "Error checking username" },
          { status: 500 },
        );
      }

      // Check if username contains any bad words (case insensitive)
      if (badWords && badWords.length > 0) {
        const lowerUsername = username.toLowerCase();
        const hasBadWord = badWords.some(({ word }) =>
          lowerUsername.includes(word.toLowerCase()),
        );

        if (hasBadWord) {
          return NextResponse.json(
            { valid: false, error: "Username contains inappropriate language" },
            { status: 400 },
          );
        }
      }

      return NextResponse.json({ valid: true });
    }

    // Check email domain
    if (!domain) {
      return NextResponse.json(
        { valid: false, error: "Email domain is required" },
        { status: 400 },
      );
    }

    // Check if the domain exists in our universities table
    const { data, error } = await supabase
      .from("universities")
      .select("id, domain, name")
      .eq("domain", domain)
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "Your university email domain is not supported. Please contact support.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ valid: true, university: data.name });
  } catch (error) {
    console.error("Error validating email domain:", error);
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

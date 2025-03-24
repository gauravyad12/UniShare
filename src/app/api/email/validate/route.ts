import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { domain, checkBadWords, username, email } = requestData;

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

    // Handle email validation
    let domainToCheck = domain;

    // If email is provided, extract domain from it
    if (email && !domainToCheck) {
      const emailParts = email.split("@");
      if (emailParts.length >= 2) {
        domainToCheck = emailParts[1].toLowerCase();
      }
    }

    // Check email domain
    if (!domainToCheck) {
      return NextResponse.json(
        { valid: false, error: "Email domain is required" },
        { status: 400 },
      );
    }

    console.log(`Validating email domain: ${domainToCheck}`);

    // Get all universities to check for matching domains
    const { data: universities, error: universityError } = await supabase
      .from("universities")
      .select("id, name, domain");

    if (universityError) {
      console.error("Error fetching universities:", universityError);
      return NextResponse.json(
        { error: "Error checking university domains" },
        { status: 500 },
      );
    }

    // Debug: Log all universities and their domains
    universities?.forEach((uni) => {
      console.log(`University: ${uni.name}, Domains: ${uni.domain}`);
    });

    // Find university with matching domain (case-insensitive, handling spaces after commas)
    const universityData = universities?.find((university) => {
      if (!university.domain) return false;
      const domains = university.domain
        .split(",")
        .map((d) => d.trim().toLowerCase());
      const matches = domains.includes(domainToCheck);
      console.log(
        `Checking ${university.name}: domains=${domains.join("|")}, match=${matches}`,
      );
      return matches;
    });

    // Common email domains that should be supported
    const commonDomains = [
      "gmail.com",
      "outlook.com",
      "hotmail.com",
      "yahoo.com",
      "icloud.com",
    ];

    console.log(
      `Domain check: ${domainToCheck}, matched university: ${universityData?.name || "none"}, in common domains: ${commonDomains.includes(domainToCheck)}`,
    );

    if (!universityData && !commonDomains.includes(domainToCheck)) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "Your email domain or university is not supported. Please contact support.",
        },
        { status: 200 }, // Use 200 status with valid:false instead of 400
      );
    }

    // If no university matched but it's a common domain, use the General Users university
    const universityToUse =
      universityData ||
      universities?.find(
        (u) =>
          u.name === "General Users" ||
          (u.domain && u.domain.toLowerCase().includes("gmail.com")) ||
          (u.domain && u.domain.toLowerCase().includes("icloud.com")),
      );

    console.log(`University to use: ${universityToUse?.name || "None found"}`);

    if (!universityToUse) {
      return NextResponse.json(
        {
          valid: false,
          error: "Could not find appropriate university for your email",
        },
        { status: 200 }, // Use 200 status with valid:false instead of 400
      );
    }

    return NextResponse.json({
      valid: true,
      university: {
        id: universityToUse.id,
        name: universityToUse.name,
        domain: universityToUse.domain,
      },
    });
  } catch (error) {
    console.error("Error validating email domain:", error);
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

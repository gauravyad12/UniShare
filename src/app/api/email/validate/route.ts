import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { domain, checkBadWords, username, email, checkStandardUser } = requestData;

    const supabase = createClient();

    // Check if Standard User university exists
    if (checkStandardUser) {
      try {
        const { data: universities, error } = await supabase
          .from("universities")
          .select("id, name")
          .eq("name", "Standard User");

        if (error) {
          console.error("Error checking for Standard User university:", error);
          return NextResponse.json({ standardUserExists: false, error: error.message });
        }

        const standardUserExists = Array.isArray(universities) && universities.length > 0;
        console.log(`Standard User university exists: ${standardUserExists}`);

        if (standardUserExists) {
          const standardUser = universities[0];
          console.log(`Found Standard User university: ID=${standardUser.id}, Name=${standardUser.name}`);
        }

        return NextResponse.json({ standardUserExists });
      } catch (error) {
        console.error("Error in checkStandardUser:", error);
        return NextResponse.json({ standardUserExists: false, error: "Internal server error" });
      }
    }

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

    // If we found a university with a matching domain, use it
    if (universityData) {
      console.log(`Found matching university: ${universityData.name}`);
      return NextResponse.json({
        valid: true,
        university: {
          id: universityData.id,
          name: universityData.name,
          domain: universityData.domain,
        },
      });
    }

    // If no university matched, check if "Standard User" university exists
    // IMPORTANT: We're looking for the exact name "Standard User" - no hardcoded alternatives
    const standardUserUniversity = universities?.find((u) =>
      u.name === "Standard User"
    );

    if (!standardUserUniversity) {
      console.log("Standard User university not found - common domains will not be accepted");
      return NextResponse.json(
        {
          valid: false,
          error: "Your email domain is not supported. Please use a university email.",
        },
        { status: 200 }, // Use 200 status with valid:false instead of 400
      );
    }

    // Get all common domains from the database
    const { data: commonDomainsData, error: commonDomainsError } = await supabase
      .from("common_domains")
      .select("domain");

    if (commonDomainsError) {
      console.error("Error fetching common domains:", commonDomainsError);
      return NextResponse.json(
        { error: "Error checking common email domains" },
        { status: 500 },
      );
    }

    // Check if the domain is in the common_domains table
    const isCommonDomain = commonDomainsData?.some(
      (item) => item.domain.toLowerCase() === domainToCheck.toLowerCase()
    );

    console.log(
      `Domain check: ${domainToCheck}, is common domain: ${isCommonDomain}`,
    );

    if (!isCommonDomain) {
      return NextResponse.json(
        {
          valid: false,
          error: "Your email domain is not supported. Please use a university email or a common email provider.",
        },
        { status: 200 }, // Use 200 status with valid:false instead of 400
      );
    }

    // If it's a common domain, use the Standard User university
    console.log(`Using Standard User university for common domain: ${domainToCheck}`);
    const universityToUse = standardUserUniversity;

    // Log the university details for debugging
    console.log(`Standard User university details: ID=${universityToUse.id}, Name=${universityToUse.name}`);

    // Double check that Standard User university exists
    if (!universityToUse || universityToUse.name !== "Standard User") {
      console.log("Standard User university not properly configured");
      return NextResponse.json(
        {
          valid: false,
          error: "System configuration error. Common email domains are not currently supported.",
        },
        { status: 200 },
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

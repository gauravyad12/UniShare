import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient, executeRawSql } from "@/utils/supabase/admin";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body instead of form data
    const body = await request.json();
    const { email, password, full_name, username } = body;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const supabase = createClient();

    // Check username availability
    if (username) {
      const { data: existingUser, error: usernameError } = await supabase
        .from("user_profiles")
        .select("username")
        .ilike("username", username)
        .limit(1);

      if (usernameError) {
        return NextResponse.json(
          { error: "Error checking username availability" },
          { status: 500 },
        );
      }

      if (existingUser && existingUser.length > 0) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 },
        );
      }
    }

    // Get invite code from cookie
    let inviteCode = "";
    try {
      // Try to get invite code from cookies
      const cookieStore = cookies();
      const inviteCodeCookie = cookieStore.get("verified_invite_code");
      inviteCode = inviteCodeCookie?.value || "";

      // If we couldn't get it from cookies, use a fallback for development
      if (!inviteCode) {
        inviteCode = "UCF2024"; // Fallback for development
        console.log("Using fallback invite code for development:", inviteCode);
      }
    } catch (error) {
      console.error("Error getting invite code cookie:", error);
      return NextResponse.json(
        { error: "Error retrieving invite code. Please try again." },
        { status: 500 },
      );
    }

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 },
      );
    }

    // Check if email domain is from a supported university
    const emailDomain = email.split("@")[1];
    if (!emailDomain) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Check if the domain exists in our universities table
    // Handle multiple domains per university (comma-separated)
    const { data: universityData, error: universityError } = await supabase
      .from("universities")
      .select("id, domain, name");

    // Find a university with a matching domain (case-insensitive)
    const emailDomainLower = emailDomain.toLowerCase();
    console.log(`Checking email domain: ${emailDomainLower}`);

    // Debug: Log all universities and their domains
    universityData?.forEach((uni) => {
      console.log(`University: ${uni.name}, Domains: ${uni.domain}`);
    });

    const matchedUniversity = universityData?.find((university) => {
      if (!university.domain) return false;
      const domains = university.domain
        .split(",")
        .map((d) => d.trim().toLowerCase());
      const matches = domains.includes(emailDomainLower);
      console.log(
        `Checking ${university.name}: domains=${domains.join("|")}, match=${matches}`,
      );
      return matches;
    });

    if (universityError) {
      return NextResponse.json(
        {
          error: "Error checking university email domains. Please try again.",
        },
        { status: 500 },
      );
    }

    // Common email domains like icloud.com should be supported
    const commonDomains = [
      "gmail.com",
      "outlook.com",
      "hotmail.com",
      "yahoo.com",
      "icloud.com",
    ];

    // Log the domain check for debugging
    console.log(
      `Email domain check: ${emailDomain}, matched university: ${!!matchedUniversity}, in common domains: ${commonDomains.includes(emailDomain.toLowerCase())}`,
    );

    if (
      !matchedUniversity &&
      !commonDomains.includes(emailDomain.toLowerCase())
    ) {
      return NextResponse.json(
        {
          error: "Your email domain is not supported. Please contact support.",
        },
        { status: 400 },
      );
    }

    // If no university matched but it's a common domain, use the General Users university
    const universityToUse =
      matchedUniversity ||
      universityData?.find(
        (u) =>
          u.name === "General Users" ||
          u.domain.toLowerCase().includes("gmail.com") ||
          u.domain.toLowerCase().includes("icloud.com"),
      );

    console.log(`University to use: ${universityToUse?.name || "None found"}`);

    if (!universityToUse) {
      return NextResponse.json(
        {
          error:
            "Could not find appropriate university for your email. Please contact support.",
        },
        { status: 400 },
      );
    }

    // Verify invite code (case-insensitive)
    const { data: inviteData, error: inviteError } = await supabase
      .from("invite_codes")
      .select("*, universities!invite_codes_university_id_fkey(domain)")
      .ilike("code", inviteCode) // Use case-insensitive matching
      .eq("is_active", true)
      .single();

    if (inviteError || !inviteData) {
      return NextResponse.json(
        { error: "Invalid or expired invite code" },
        { status: 400 },
      );
    }

    // Sign up the user
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || "",
          email: email,
          username: username,
        },
        emailRedirectTo: `${request.headers.get("origin")}/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (user) {
      try {
        // Create admin client to bypass RLS for critical operations
        const adminClient = createAdminClient();
        if (!adminClient) {
          console.error("Failed to create admin client for invite code update");
          // Continue with regular client as fallback
        }

        // Update invite code usage count using admin client or direct SQL
        let inviteCodeUpdated = false;

        if (adminClient) {
          // Method 1: Use admin client to update invite code
          const { error: adminUpdateError } = await adminClient
            .from("invite_codes")
            .update({ current_uses: (inviteData.current_uses || 0) + 1 })
            .eq("id", inviteData.id);

          if (adminUpdateError) {
            console.error(
              "Error updating invite code with admin client:",
              adminUpdateError,
            );
            // Will try SQL method next
          } else {
            console.log(
              `Successfully updated invite code usage with admin client for code ID: ${inviteData.id}`,
            );
            inviteCodeUpdated = true;
          }
        }

        // Method 2: If admin client update failed, try direct SQL
        if (!inviteCodeUpdated && adminClient) {
          const updateSql = `
            UPDATE invite_codes 
            SET current_uses = COALESCE(current_uses, 0) + 1 
            WHERE id = $1 
            RETURNING id, current_uses
          `;

          const { data: sqlResult, error: sqlError } = await executeRawSql(
            adminClient,
            updateSql,
            [inviteData.id],
          );

          if (sqlError) {
            console.error("Error updating invite code with SQL:", sqlError);
          } else {
            console.log(
              `Successfully updated invite code with SQL for code ID: ${inviteData.id}`,
              sqlResult,
            );
            inviteCodeUpdated = true;
          }
        }

        // Method 3: Fallback to regular client if all else fails
        if (!inviteCodeUpdated) {
          const { error: updateError } = await supabase
            .from("invite_codes")
            .update({ current_uses: (inviteData.current_uses || 0) + 1 })
            .eq("id", inviteData.id);

          if (updateError) {
            console.error(
              "Error updating invite code usage count with regular client:",
              updateError,
            );
          } else {
            console.log(
              `Successfully updated invite code usage with regular client for code ID: ${inviteData.id}`,
            );
            inviteCodeUpdated = true;
          }
        }

        // Create user profile with university info from invite code (store username in lowercase)
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: user.id,
            full_name: full_name || "",
            username: username ? username.toLowerCase() : null,
            university_id: universityToUse.id,
            university_name: universityToUse.name || "University",
            created_at: new Date().toISOString(),
            is_verified: false,
            invite_code_id: inviteData.id,
          });

        if (profileError) {
          console.error("Error creating user profile:", profileError);
        }

        // Create user settings for the new user if they don't already exist
        try {
          // First check if settings already exist for this user
          const { data: existingSettings } = await supabase
            .from("user_settings")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();

          // Only insert if no settings exist
          if (!existingSettings) {
            const { error: settingsError } = await supabase
              .from("user_settings")
              .insert({
                user_id: user.id,
                email_notifications: true,
                study_group_notifications: true,
                resource_notifications: true,
                profile_visibility: true,
                theme_preference: "system",
                color_scheme: "default",
                font_size: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (settingsError) {
              console.error("Error creating user settings:", settingsError);
            }
          } else {
            console.log("User settings already exist for user ID:", user.id);
          }
        } catch (settingsError) {
          console.error("Error creating user settings:", settingsError);
          // Continue despite settings creation error
        }

        // Check if this invite code was sent via email and update its status
        // Use admin client if available for this operation too
        let sentInvitation = null;
        let sentInvitationError = null;

        if (adminClient) {
          // Try with admin client first
          const result = await adminClient
            .from("sent_invitations")
            .select("id")
            .eq("invite_code_id", inviteData.id)
            .eq("sent_to_email", email)
            .eq("status", "sent")
            .limit(1);

          sentInvitation = result.data;
          sentInvitationError = result.error;
        } else {
          // Fallback to regular client
          const result = await supabase
            .from("sent_invitations")
            .select("id")
            .eq("invite_code_id", inviteData.id)
            .eq("sent_to_email", email)
            .eq("status", "sent")
            .limit(1);

          sentInvitation = result.data;
          sentInvitationError = result.error;
        }

        if (sentInvitationError) {
          console.error("Error finding sent invitation:", sentInvitationError);
        }

        if (sentInvitation && sentInvitation.length > 0) {
          // Update the invitation status to used
          let invitationUpdated = false;

          if (adminClient) {
            // Try with admin client first
            const { error: updateInvitationError } = await adminClient
              .from("sent_invitations")
              .update({ status: "used" })
              .eq("id", sentInvitation[0].id);

            if (updateInvitationError) {
              console.error(
                "Error updating sent invitation status with admin client:",
                updateInvitationError,
              );
            } else {
              console.log(
                `Successfully updated invitation status with admin client for ID: ${sentInvitation[0].id}`,
              );
              invitationUpdated = true;
            }
          }

          // Fallback to regular client if admin update failed
          if (!invitationUpdated) {
            const { error: updateInvitationError } = await supabase
              .from("sent_invitations")
              .update({ status: "used" })
              .eq("id", sentInvitation[0].id);

            if (updateInvitationError) {
              console.error(
                "Error updating sent invitation status with regular client:",
                updateInvitationError,
              );
            } else {
              console.log(
                `Successfully updated invitation status with regular client for ID: ${sentInvitation[0].id}`,
              );
            }
          }
        } else {
          console.log(
            `No sent invitation found for email: ${email} and invite code ID: ${inviteData.id}`,
          );
        }

        // Try to clear the invite code cookie
        try {
          const cookieStore = cookies();
          cookieStore.delete("verified_invite_code");
        } catch (cookieError) {
          console.error("Error removing invite code cookie:", cookieError);
          // Continue despite cookie removal error
        }

        return NextResponse.json({
          success: true,
          message:
            "User created successfully. Please check your email for verification.",
        });
      } catch (err) {
        console.error("Error creating user profile:", err);
        return NextResponse.json({
          success: true,
          message:
            "User created but there was an issue with profile creation. Please contact support.",
        });
      }
    } else {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in sign-up API route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}

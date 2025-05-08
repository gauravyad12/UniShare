import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient, executeRawSql } from "@/utils/supabase/admin";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  try {
    // Parse JSON body instead of form data
    const body = await request.json();
    let { email, password, full_name, username } = body;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Check for email variations
    try {
      const { hasGmailDotVariations, hasTagVariations, normalizeEmail } = await import('@/utils/emailNormalization');

      // Check for Gmail dot variations
      if (hasGmailDotVariations(email)) {
        return NextResponse.json(
          { error: "Gmail addresses with dots (.) are not allowed. Please use the version without dots." },
          { status: 400 },
        );
      }

      // Check for tag/label variations (plus, hyphen, underscore)
      if (hasTagVariations(email)) {
        return NextResponse.json(
          { error: "Email addresses with tags (+, -, _) are not allowed" },
          { status: 400 },
        );
      }

      // Normalize the email for further processing
      const normalizedEmail = normalizeEmail(email);
      if (normalizedEmail !== email.toLowerCase()) {
        console.log(`Email normalized from ${email} to ${normalizedEmail}`);
        // Continue with the normalized email
        email = normalizedEmail;
      }
    } catch (error) {
      console.error("Error checking email variations:", error);
      // Continue with validation if the import fails
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

    let matchedUniversity = universityData?.find((university) => {
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

    // Validate email domain using our API
    try {
      // Call our email validation API
      const validateResponse = await fetch(new URL('/api/email/validate', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: emailDomain }),
      });

      const validationData = await validateResponse.json();

      if (!validateResponse.ok || !validationData.valid) {
        return NextResponse.json(
          {
            error: validationData.error || "Your email domain is not supported. Please use a university email or a common email provider.",
          },
          { status: 400 },
        );
      }

      // If validation passed, use the university from the validation response
      if (validationData.university) {
        console.log(`Using university from validation: ${validationData.university.name}`);
        // For common domains, the validation API will return the Standard User university
        if (validationData.university.name === "Standard User") {
          console.log(`Email domain ${emailDomain} is a common domain, assigning to Standard User university`);
          // Find the Standard User university in our data - exact name match only
          const standardUser = universityData?.find(u =>
            u.name === "Standard User"
          );
          if (standardUser) {
            matchedUniversity = standardUser;
            console.log(`Found Standard User university: ID=${standardUser.id}, Name=${standardUser.name}`);
          } else {
            // If we can't find it in our data, use the one from the validation response
            matchedUniversity = {
              id: validationData.university.id,
              name: validationData.university.name,
              domain: validationData.university.domain
            };
            console.log(`Using Standard User from validation: ID=${matchedUniversity.id}`);
          }
        } else {
          // For university domains, find the matching university in our data
          matchedUniversity = universityData?.find(u => u.id === validationData.university.id) || matchedUniversity;
          console.log(`Using university domain: ${matchedUniversity?.name || 'Unknown'}`);
        }
      }
    } catch (validationError) {
      console.error("Error validating email domain:", validationError);
      // Continue with existing validation as fallback
      if (!matchedUniversity) {
        return NextResponse.json(
          {
            error: "Error validating email domain. Please try again.",
          },
          { status: 500 },
        );
      }
    }

    // Determine which university to use
    let universityToUse = matchedUniversity;

    // If no university matched, check if this is a common domain and if Standard User university exists
    if (!universityToUse) {
      // First, check if Standard User university exists
      const standardUser = universityData?.find(u => u.name === "Standard User");

      if (!standardUser) {
        console.log("Standard User university not found - common domains will not be accepted");
        // If Standard User doesn't exist, we won't accept common domains
        return NextResponse.json(
          {
            error: "Your email domain is not supported. Please use a university email.",
          },
          { status: 400 },
        );
      }

      // If Standard User exists, check if the email domain is in common_domains table
      try {
        const { data: commonDomainsData } = await supabase
          .from("common_domains")
          .select("domain")
          .eq("domain", emailDomain.toLowerCase())
          .maybeSingle();

        if (commonDomainsData) {
          console.log(`Found ${emailDomain} in common_domains table`);
          // This is a common domain, use the Standard User university
          universityToUse = standardUser;
          console.log(`Assigning common domain user to Standard User university: ID=${standardUser.id}`);
        } else {
          console.log(`${emailDomain} not found in common_domains table`);
          // Not a university domain and not in common_domains
          return NextResponse.json(
            {
              error: "Your email domain is not supported. Please use a university email or a common email provider.",
            },
            { status: 400 },
          );
        }
      } catch (commonDomainError) {
        console.error("Error checking common domains:", commonDomainError);
        return NextResponse.json(
          {
            error: "Error validating email domain. Please try again.",
          },
          { status: 500 },
        );
      }
    }

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
      .select("*, created_by, universities!invite_codes_university_id_fkey(domain)")
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
        emailRedirectTo: `https://unishare.app/auth/verification-success`,
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

        // Update invite code usage count using a direct approach
        let inviteCodeUpdated = false;

        try {
          // First, try using the increment_column_value function with admin client
          if (adminClient) {
            const { data: rpcData, error: rpcError } = await adminClient.rpc(
              'increment_column_value',
              {
                p_table_name: 'invite_codes',
                p_column_name: 'current_uses',
                p_record_id: inviteData.id,
                p_increment_by: 1
              }
            );

            if (rpcError) {
              console.error("Error using RPC to update invite code:", rpcError);
              // Will try next method
            } else {
              console.log(`Successfully updated invite code usage with RPC for code ID: ${inviteData.id}`);
              inviteCodeUpdated = true;
            }
          }

          // Method 2: If admin client RPC failed, try a simple update with current_uses + 1
          if (!inviteCodeUpdated && adminClient) {
            // First get the current value
            const { data: currentData } = await adminClient
              .from("invite_codes")
              .select("current_uses")
              .eq("id", inviteData.id)
              .single();

            if (currentData) {
              const currentUses = currentData.current_uses || 0;
              const { error: updateError } = await adminClient
                .from("invite_codes")
                .update({ current_uses: currentUses + 1 })
                .eq("id", inviteData.id);

              if (updateError) {
                console.error("Error updating invite code with admin client:", updateError);
              } else {
                console.log(`Successfully updated invite code usage with admin client for code ID: ${inviteData.id}`);
                inviteCodeUpdated = true;
              }
            }
          }

          // Method 3: Fallback to regular client if all else fails
          if (!inviteCodeUpdated) {
            // First get the current value
            const { data: currentData } = await supabase
              .from("invite_codes")
              .select("current_uses")
              .eq("id", inviteData.id)
              .single();

            if (currentData) {
              const currentUses = currentData.current_uses || 0;
              const { error: updateError } = await supabase
                .from("invite_codes")
                .update({ current_uses: currentUses + 1 })
                .eq("id", inviteData.id);

              if (updateError) {
                console.error("Error updating invite code with regular client:", updateError);
              } else {
                console.log(`Successfully updated invite code usage with regular client for code ID: ${inviteData.id}`);
                inviteCodeUpdated = true;
              }
            }
          }

          if (!inviteCodeUpdated) {
            console.warn(`Failed to update invite code usage count for ID: ${inviteData.id}`);
          }
        } catch (updateError) {
          console.error("Unexpected error updating invite code usage:", updateError);
          // Continue with user creation even if invite code update fails
        }

        // Check if profile already exists (created by trigger)
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        let profileError = null;

        if (profileCheckError && profileCheckError.code !== "PGRST116") {
          // Real error checking for profile
          console.error("Error checking for existing profile:", profileCheckError);
          profileError = profileCheckError;
        } else if (!existingProfile) {
          // Profile doesn't exist, create it
          // Create user profile with university info from invite code (store username in lowercase)
          const { error } = await supabase
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
          profileError = error;
        } else {
          // Profile exists, update it with the correct university and invite code info
          const { error } = await supabase
            .from("user_profiles")
            .update({
              university_id: universityToUse.id,
              university_name: universityToUse.name || "University",
              invite_code_id: inviteData.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);
          profileError = error;
        }

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

        // First check if the invite code has a creator (created_by)
        // Only proceed with invitation updates and notifications if there's a creator
        if (inviteData.created_by) {
          console.log(`Invite code has a creator: ${inviteData.created_by}`);

          // Check if this invite code was sent via email and update its status
          try {
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
          } catch (invitationError) {
            console.error("Error processing invitation status:", invitationError);
            // Continue with user creation even if invitation update fails
          }
        } else {
          console.log(`Invite code ${inviteData.id} has no creator, skipping invitation status update and notifications`);
        }

        // Try to clear the invite code cookie
        try {
          const cookieStore = cookies();
          cookieStore.delete("verified_invite_code");
        } catch (cookieError) {
          console.error("Error removing invite code cookie:", cookieError);
          // Continue despite cookie removal error
        }

        // Add user to Resend audience if they have email notifications enabled
        try {
          // Get user settings to check if email notifications are enabled
          const { data: userSettings } = await supabase
            .from("user_settings")
            .select("email_notifications")
            .eq("user_id", user.id)
            .single();

          // Default to true if not explicitly set to false
          const emailNotificationsEnabled = userSettings?.email_notifications !== false;

          if (emailNotificationsEnabled) {
            // Add user to Resend audience
            const resendResponse = await fetch(new URL('/api/resend/audience', request.url), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email,
                fullName: full_name || '',
                userId: user.id,
                fromServer: true
              }),
            });

            const resendData = await resendResponse.json();
            console.log('Resend audience response:', resendData);
          }
        } catch (resendError) {
          console.error('Error adding user to Resend audience:', resendError);
          // Continue despite Resend error
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

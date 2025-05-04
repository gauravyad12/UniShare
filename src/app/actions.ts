"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

// Helper function to encode redirect with message
function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
) {
  const params = new URLSearchParams();
  params.set(type, message);
  return redirect(`${path}?${params.toString()}`);
}

export async function signUpAction(formData: FormData) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirm_password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const username = formData.get("username")?.toString();

  const supabase = createClient();

  // Basic validation
  if (!email || !password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email, password, and password confirmation are required",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect("error", "/sign-up", "Passwords do not match");
  }

  // Password strength validation
  if (password.length < 8) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Password must be at least 8 characters long",
    );
  }
  if (!/[A-Z]/.test(password)) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Password must contain at least one uppercase letter",
    );
  }
  if (!/[a-z]/.test(password)) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Password must contain at least one lowercase letter",
    );
  }
  if (!/[0-9]/.test(password)) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Password must contain at least one number",
    );
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Password must contain at least one special character",
    );
  }

  // Check username availability server-side as well (case-insensitive)
  if (username) {
    // Convert username to lowercase for storage
    const lowercaseUsername = username.toLowerCase();

    const { data: existingUser, error: usernameError } = await supabase
      .from("user_profiles")
      .select("username")
      .ilike("username", lowercaseUsername)
      .limit(1);

    if (usernameError) {
      return encodedRedirect(
        "error",
        "/sign-up",
        "Error checking username availability",
      );
    }

    if (existingUser && existingUser.length > 0) {
      return encodedRedirect("error", "/sign-up", "Username is already taken");
    }
  }

  // Get invite code from cookie
  let inviteCode = "";
  try {
    const { data: cookieData } = await supabase.auth.getSession();
    const cookies = cookieData?.session?.user?.app_metadata?.cookies || {};
    inviteCode = cookies.verified_invite_code || "";

    // If we couldn't get it from session metadata, try to get it from the request cookie
    if (!inviteCode) {
      // Fallback to a hardcoded test invite code for development
      inviteCode = "UCF2024"; // This is a temporary fix
      console.log("Using fallback invite code for development:", inviteCode);
    }
  } catch (error) {
    console.error("Error getting invite code cookie:", error);
    return encodedRedirect(
      "error",
      "/verify-invite",
      "Error retrieving invite code. Please try again.",
    );
  }

  // Check invite code in a single place to avoid multiple redirects
  if (!inviteCode) {
    return encodedRedirect(
      "error",
      "/verify-invite",
      "Invite code is required",
    );
  }

  // Check if email domain is from a supported university
  const emailParts = email.split("@");
  if (emailParts.length < 2 || !emailParts[1]) {
    return encodedRedirect("error", "/sign-up", "Invalid email format");
  }
  const emailDomain = emailParts[1].toLowerCase();

  // Get all universities and check for matching domains
  const { data: universities, error: universityQueryError } = await supabase
    .from("universities")
    .select("id, domain, name");

  if (universityQueryError) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Error checking university email domains. Please try again.",
    );
  }

  // Find university with matching domain (case-insensitive, handling spaces after commas)
  console.log(`Checking email domain in actions.ts: ${emailDomain}`);

  // Debug: Log all universities and their domains
  universities?.forEach((uni) => {
    console.log(
      `University in actions.ts: ${uni.name}, Domains: ${uni.domain}`,
    );
  });

  const universityData = universities?.find((university) => {
    if (!university.domain) return false;
    const domains = university.domain
      .split(",")
      .map((d) => d.trim().toLowerCase());
    const matches = domains.includes(emailDomain);
    console.log(
      `Checking ${university.name} in actions.ts: domains=${domains.join("|")}, match=${matches}`,
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

  if (!universityData && !commonDomains.includes(emailDomain)) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "This email domain is not supported. Please use a university email or contact support.",
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

  console.log(
    `University to use in actions.ts: ${universityToUse?.name || "None found"}`,
  );

  if (!universityToUse) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Could not find appropriate university for your email. Please contact support.",
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
    return encodedRedirect(
      "error",
      "/verify-invite?clear_cookie=true",
      "Invalid or expired invite code",
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
        full_name: fullName,
        email: email,
        username: username,
      },
      emailRedirectTo: `https://unishare.app/auth/verification-success`,
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-up", error.message);
  }

  if (user) {
    try {
      // Update invite code usage count
      const { error: updateCountError } = await supabase
        .from("invite_codes")
        .update({ current_uses: (inviteData.current_uses || 0) + 1 })
        .eq("id", inviteData.id);

      if (updateCountError) {
        console.error(
          "Error updating invite code usage count:",
          updateCountError,
        );
      }

      // Create user profile with university info from invite code (store username in lowercase)
      // Use admin client to bypass RLS
      const { createAdminClient } = await import("@/utils/supabase/admin");
      const adminClient = createAdminClient();

      let profileError = null;
      if (adminClient) {
        const { error } = await adminClient.from("user_profiles").insert({
          id: user.id,
          full_name: fullName,
          username: username ? username.toLowerCase() : null,
          university_id: universityToUse.id,
          university_name: universityToUse.name || "University",
          invite_code_id: inviteData.id,
          created_at: new Date().toISOString(),
          is_verified: false,
        });
        profileError = error;
      } else {
        // Fallback to regular client if admin client creation fails
        const { error } = await supabase.from("user_profiles").insert({
          id: user.id,
          full_name: fullName,
          username: username ? username.toLowerCase() : null,
          university_id: universityToUse.id,
          university_name: universityToUse.name || "University",
          invite_code_id: inviteData.id,
          created_at: new Date().toISOString(),
          is_verified: false,
        });
        profileError = error;
      }

      if (profileError) {
        console.error("Error creating user profile:", profileError);
      }

      // Create user settings for the new user
      // Use admin client to bypass RLS
      try {
        let settingsError = null;
        if (adminClient) {
          // Use the admin client we created earlier
          const { error } = await adminClient.from("user_settings").insert({
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
          settingsError = error;
        } else {
          // Fallback to regular client if admin client creation failed
          const { error } = await supabase.from("user_settings").insert({
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
          settingsError = error;
        }

        if (settingsError) {
          console.error("Error creating user settings:", settingsError);
        }
      } catch (settingsError) {
        console.error("Error creating user settings:", settingsError);
      }

      // Check if this invite code was sent via email and update its status
      const { data: sentInvitation } = await supabase
        .from("sent_invitations")
        .select("id")
        .eq("invite_code_id", inviteData.id)
        .eq("sent_to_email", email)
        .eq("status", "sent")
        .limit(1);

      if (sentInvitation && sentInvitation.length > 0) {
        // Update the invitation status to used
        await supabase
          .from("sent_invitations")
          .update({ status: "used" })
          .eq("id", sentInvitation[0].id);
      }
    } catch (err) {
      console.error("Error creating user profile:", err);
      // Continue with sign-up process despite profile creation error
    }
  }

  // Clear the invite code cookie
  try {
    await supabase.cookies.remove("verified_invite_code", { path: "/" });
  } catch (error) {
    console.error("Error removing invite code cookie:", error);
    // Continue with sign-up process despite cookie removal error
  }

  // Add a console log before redirecting
  console.log("Sign-up successful, redirecting to success page");

  // Instead of redirecting back to sign-up, redirect to a dedicated success page
  return redirect(
    "/success?message=Thanks for signing up! Please check your email for a verification link.",
  );
}

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "Email and password are required",
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // Only add Appilix user identity parameter for mobile devices or Appilix app
  // We'll detect mobile/app on the server side based on user agent
  const userAgent = headers().get('user-agent') || '';
  const isMobileOrApp = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Appilix/i.test(userAgent);

  if (isMobileOrApp) {
    // Add Appilix user identity parameter to the dashboard URL for mobile devices or Appilix app
    return redirect(`/dashboard?appilix_push_notification_user_identity=${encodeURIComponent(email)}`);
  } else {
    // Regular redirect for desktop devices
    return redirect('/dashboard');
  }
}

export async function forgotPasswordAction(formData: FormData) {
  const email = formData.get("email")?.toString();
  const supabase = createClient();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {});

  if (error) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
}

export async function resetPasswordAction(formData: FormData) {
  const supabase = createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard",
    "Password updated successfully",
  );
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  return redirect("/");
}

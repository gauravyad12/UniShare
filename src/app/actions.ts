"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

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

  // Get invite code from cookie
  const cookieStore = await supabase.cookies.get("verified_invite_code");
  const inviteCode = cookieStore?.value;

  if (!inviteCode) {
    return encodedRedirect(
      "error",
      "/verify-invite",
      "Invite code is required",
    );
  }

  // Check if email domain is from a supported university
  const emailDomain = email.split("@")[1];
  if (!emailDomain) {
    return encodedRedirect("error", "/sign-up", "Invalid email format");
  }

  // Check if the domain exists in our universities table
  const { data: universityData, error: universityError } = await supabase
    .from("universities")
    .select("id, domain, name")
    .eq("domain", emailDomain)
    .single();

  if (universityError || !universityData) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Your university email domain is not supported. Please contact support.",
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
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-up", error.message);
  }

  if (user) {
    try {
      // Update invite code usage count
      await supabase
        .from("invite_codes")
        .update({ current_uses: (inviteData.current_uses || 0) + 1 })
        .eq("id", inviteData.id);

      // Create user profile with university info from invite code
      await supabase.from("user_profiles").insert({
        id: user.id,
        full_name: fullName,
        username: username,
        university_id: universityData.id,
        university_name: universityData.name,
        invite_code_id: inviteData.id,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error creating user profile:", err);
      // Continue with sign-up process despite profile creation error
    }
  }

  // Clear the invite code cookie
  await supabase.cookies.remove("verified_invite_code", { path: "/" });

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
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

  return redirect("/dashboard");
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

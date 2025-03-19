"use server";

import { createClient } from "../../supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirm_password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const username = formData.get("username")?.toString();
  const inviteCode = formData.get("invite_code")?.toString();
  const supabase = await createClient();

  if (!email || !password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email, password, and password confirmation are required",
    );
  }

  // Password validation
  if (password !== confirmPassword) {
    return encodedRedirect("error", "/sign-up", "Passwords do not match");
  }

  // Check password strength
  if (password.length < 8 || password.length > 50) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Password must be between 8 and 50 characters",
    );
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    );
  }

  if (!username) {
    return encodedRedirect("error", "/sign-up", "Username is required");
  }

  if (!inviteCode) {
    return encodedRedirect("error", "/sign-up", "Invite code is required");
  }

  // Check if email domain is from a supported university
  const emailDomain = email.split("@")[1];
  if (!emailDomain) {
    return encodedRedirect("error", "/sign-up", "Invalid email format");
  }

  // Check if the domain exists in our universities table
  const { data: universityData, error: universityError } = await supabase
    .from("universities")
    .select("id, domain")
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
      "/sign-up",
      "Invalid or expired invite code",
    );
  }

  // Check if invite code has reached max uses
  if (inviteData.max_uses && inviteData.current_uses >= inviteData.max_uses) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "This invite code has reached its maximum number of uses",
    );
  }

  // Check if invite code has expired
  if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
    return encodedRedirect("error", "/sign-up", "This invite code has expired");
  }

  // Check if the invite code's university matches the email domain
  const inviteUniversity = inviteData.universities;
  if (inviteUniversity && inviteUniversity.domain !== emailDomain) {
    return encodedRedirect(
      "error",
      "/sign-up",
      `This invite code is for ${inviteUniversity.domain} email addresses only`,
    );
  }

  // Check if username is already taken
  const { data: existingUsername, error: usernameError } = await supabase
    .from("user_profiles")
    .select("username")
    .eq("username", username)
    .single();

  if (existingUsername) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "This username is already taken. Please choose another one.",
    );
  }

  // Check if username contains bad words
  const { data: badWords, error: badWordsError } = await supabase
    .from("bad_words")
    .select("word");

  if (badWords) {
    // Check if any bad word is contained within the username (case insensitive)
    const containsBadWord = badWords.some((badWordObj) => {
      const badWord = badWordObj.word.toLowerCase();
      return username.toLowerCase().includes(badWord);
    });

    if (containsBadWord) {
      return encodedRedirect(
        "error",
        "/sign-up",
        "This username contains prohibited words. Please choose another one.",
      );
    }
  }

  // Check if user with this email already exists
  const { data: existingUser, error: existingUserError } =
    await supabase.auth.admin
      .listUsers({ filter: `email.eq.${email}` })
      .catch(() => ({ data: { users: [] }, error: null }));

  if (existingUser && existingUser.users && existingUser.users.length > 0) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "An account with this email already exists. Please sign in instead.",
    );
  }

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
      const { error: inviteUpdateError } = await supabase
        .from("invite_codes")
        .update({ current_uses: (inviteData.current_uses || 0) + 1 })
        .eq("id", inviteData.id);

      const { error: updateError } = await supabase.from("users").insert({
        id: user.id,
        user_id: user.id,
        name: fullName,
        email: email,
        token_identifier: user.id,
        created_at: new Date().toISOString(),
      });

      // Create user profile with university info from invite code
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          id: user.id,
          full_name: fullName,
          username: username,
          university_id: inviteData.university_id,
          invite_code_id: inviteData.id,
          created_at: new Date().toISOString(),
        });

      if (updateError || profileError || inviteUpdateError) {
        // Error handling without console.error
      }
    } catch (err) {
      // Error handling without console.error
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const callbackUrl = formData.get("callbackUrl")?.toString();

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

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const checkUserSubscription = async (userId: string) => {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error) {
    return false;
  }

  return !!subscription;
};

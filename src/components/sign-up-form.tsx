"use client";

import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import AnimatedLogo from "@/components/animated-logo";
import { useRouter } from "next/navigation";

interface SignUpFormProps {
  message: Message;
}

export default function SignUpForm({ message }: SignUpFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "available" | "unavailable" | "checking" | "invalid" | null
  >(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [standardUserExists, setStandardUserExists] = useState<boolean>(false);

  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  // Password validation
  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  // Check if passwords match
  const validatePasswordMatch = () => {
    if (password && confirmPassword && password !== confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  };

  // Check username availability
  const checkUsername = async (username: string) => {
    if (!username) {
      setUsernameStatus(null);
      setUsernameError(null);
      return;
    }

    // Validate username format
    const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validUsernameRegex.test(username)) {
      setUsernameStatus("invalid");
      setUsernameError(
        "Username can only contain letters, numbers, underscores, and hyphens",
      );
      return;
    }

    setUsernameStatus("checking");
    try {
      const response = await fetch("/api/username/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.ok) {
        setUsernameStatus(data.available ? "available" : "unavailable");
        setUsernameError(data.available ? null : "Username is already taken");
      } else {
        setUsernameStatus("invalid");
        setUsernameError(data.error || "Error checking username");
      }
    } catch (error) {
      setUsernameStatus("invalid");
      setUsernameError("Error checking username availability");
    }
  };

  // Debounced username check
  useEffect(() => {
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    if (username.length > 2) {
      usernameCheckTimeout.current = setTimeout(() => {
        checkUsername(username);
      }, 500);
    } else {
      setUsernameStatus(null);
      setUsernameError(null);
    }

    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, [username]);

  // Validate password on change
  useEffect(() => {
    if (password) {
      setPasswordError(validatePassword(password));
    } else {
      setPasswordError(null);
    }
  }, [password]);

  // Validate full name
  const validateFullName = (name: string) => {
    if (!name || name.trim().length < 2) {
      return "Full name must be at least 2 characters";
    }
    return null;
  };

  // Validate username
  const validateUsername = (username: string) => {
    if (!username || username.trim().length < 3) {
      return "Username must be at least 3 characters";
    }
    return null;
  };

  // Validate full name on change
  useEffect(() => {
    if (fullName) {
      setFullNameError(validateFullName(fullName));
    } else {
      setFullNameError(null);
    }
  }, [fullName]);

  // Check form validity
  useEffect(() => {
    const passwordValid = password.length >= 8 && !validatePassword(password);
    const passwordsMatch =
      password === confirmPassword && confirmPassword !== "";
    const usernameValid =
      usernameStatus === "available" && username.length >= 3;
    const nameValid = fullName.length >= 2;

    setIsFormValid(
      passwordValid &&
        passwordsMatch &&
        usernameValid &&
        nameValid &&
        !isSubmitting,
    );
  }, [
    password,
    confirmPassword,
    usernameStatus,
    username,
    fullName,
    isSubmitting,
    emailError,
  ]);

  // Check if Standard User university exists
  useEffect(() => {
    const checkStandardUser = async () => {
      try {
        // Use the email validation API to check if Standard User exists
        const response = await fetch('/api/email/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ checkStandardUser: true }),
        });

        const data = await response.json();
        setStandardUserExists(data.standardUserExists || false);
        console.log('Standard User university exists:', data.standardUserExists);
      } catch (error) {
        console.error('Error checking Standard User university:', error);
        setStandardUserExists(false);
      }
    };

    checkStandardUser();
  }, []);

  // Check for domain not supported error in message prop
  useEffect(() => {
    if (message.error) {
      if (
        message.error.includes("university/domain isn't supported") ||
        message.error.includes("Your university/domain isn't supported") ||
        message.error.includes("This email domain is not supported") ||
        message.error.includes("Your email domain is not supported") ||
        message.error.includes("Your email domain or university is not supported") ||
        message.error.includes("Please use a university email") ||
        message.error.includes("Please use a university email or a common email provider")
      ) {
        setEmailError(message.error);
        setFormError(null); // Clear the form error to avoid duplicate messages
      } else if (message.error.includes("Invalid email format")) {
        setEmailError(
          "Invalid email format. Please enter a valid email address.",
        );
      }
    }
  }, [message]);

  // Check for bad words in text
  const checkForBadWords = async (text: string, fieldName: string = 'Text') => {
    try {
      // For username, check if it's valid format
      if (fieldName === 'Username') {
        const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!validUsernameRegex.test(text)) {
          return {
            hasBadWord: true,
            error:
              "Username can only contain letters, numbers, underscores, and hyphens",
          };
        }

        // Check for minimum length
        if (text.length < 3) {
          return {
            hasBadWord: true,
            error: "Username must be at least 3 characters long",
          };
        }
      }

      // Check for bad words directly using the utility
      const { containsBadWords } = await import('@/utils/badWords');
      const hasBadWord = await containsBadWords(text);

      if (hasBadWord) {
        return {
          hasBadWord: true,
          error: `${fieldName} contains inappropriate language`,
        };
      }

      return { hasBadWord: false, error: null };
    } catch (error) {
      console.error(`Error checking for bad words in ${fieldName}:`, error);
      return { hasBadWord: false, error: `Error checking ${fieldName.toLowerCase()}` };
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset error and success messages
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    // Get form data
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const usernameValue = formData.get("username") as string;
    const passwordValue = formData.get("password") as string;
    const confirmPasswordValue = formData.get("confirm_password") as string;
    const fullNameValue = formData.get("full_name") as string;

    // Client-side validation
    // 1. Check full name
    const nameError = validateFullName(fullNameValue);
    if (nameError) {
      setFullNameError(nameError);
      setIsSubmitting(false);
      return;
    }

    // 1.1 Check for bad words in full name
    const fullNameBadWordsCheck = await checkForBadWords(fullNameValue, 'Full name');
    if (fullNameBadWordsCheck.hasBadWord) {
      setFullNameError(fullNameBadWordsCheck.error || "Full name contains inappropriate language");
      setIsSubmitting(false);
      return;
    }

    // 2. Check username
    const usernameValidationError = validateUsername(usernameValue);
    if (usernameValidationError) {
      setUsernameError(usernameValidationError);
      setIsSubmitting(false);
      return;
    }

    // 3. Check for bad words in username
    const badWordsCheck = await checkForBadWords(usernameValue, 'Username');
    if (badWordsCheck.hasBadWord) {
      setUsernameStatus("invalid");
      setUsernameError(
        badWordsCheck.error || "Username contains inappropriate language",
      );
      setIsSubmitting(false);
      return;
    }

    // 4. Check for email variations (plus, dots, tags, etc.)
    try {
      // Dynamically import the email normalization utility
      const { detectEmailVariations, hasGmailDotVariations, hasTagVariations } = await import('@/utils/emailNormalization');

      // Check for Gmail dot variations
      if (hasGmailDotVariations(email)) {
        setEmailError("Gmail addresses with dots (.) are not allowed. Please use the version without dots.");
        setIsSubmitting(false);
        return;
      }

      // Check for tag/label variations (plus, hyphen, underscore)
      if (hasTagVariations(email)) {
        setEmailError("Email addresses with tags (+, -, _) are not allowed");
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error("Error checking email variations:", error);
      // Continue with validation if the import fails
    }

    // 5. Check email domain
    const emailDomain = email.split("@")[1];
    if (!emailDomain) {
      setEmailError("Invalid email format");
      setIsSubmitting(false);
      return;
    }

    try {
      // Validate email domain
      const domainResponse = await fetch("/api/email/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: emailDomain }),
      });

      const data = await domainResponse.json();

      if (!domainResponse.ok || !data.valid) {
        setEmailError(
          data.error ||
            "Your email domain or university is not supported. Please contact support.",
        );
        setIsSubmitting(false);
        return;
      }

      // 5. Check password
      const passwordValidationError = validatePassword(passwordValue);
      if (passwordValidationError) {
        setPasswordError(passwordValidationError);
        setIsSubmitting(false);
        return;
      }

      // 6. Check passwords match
      if (passwordValue !== confirmPasswordValue) {
        setPasswordError("Passwords do not match");
        setIsSubmitting(false);
        return;
      }

      // All validation passed, submit the form
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: passwordValue,
          full_name: fullNameValue,
          username: usernameValue,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Clear form
        form.reset();
        // Redirect to success page immediately
        router.push("/success");
      } else {
        setFormError(
          result.error || "Failed to create account. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error during sign up:", error);
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col space-y-7 relative" onSubmit={handleSubmit}>
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">Join UniShare</h1>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            className="text-primary font-medium hover:underline transition-all"
            href="/sign-in"
          >
            Sign in
          </Link>
        </p>
      </div>

      {formSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {formSuccess}
        </div>
      )}

      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {formError}
        </div>
      )}

      <div className="space-y-5">
        <div className="space-y-2.5">
          <Label htmlFor="full_name" className="text-sm font-medium flex items-center gap-1.5">
            Full Name
          </Label>
          <div className="relative group">
            <Input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="John Doe"
              required
              className="w-full h-11 pl-4 pr-4 rounded-xl border-muted bg-background/50 transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 group-hover:border-primary/30"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              minLength={2}
            />
            <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
          </div>
          {fullNameError && (
            <p className="text-xs text-red-500">{fullNameError}</p>
          )}
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5">
            University Email
          </Label>
          <div className="relative group">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@university.edu"
              required
              className="w-full h-11 pl-4 pr-4 rounded-xl border-muted bg-background/50 transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 group-hover:border-primary/30"
            />
            <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
          </div>
          {emailError ? (
            <p className="text-xs text-red-500">{emailError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {standardUserExists
                ? "Use a university email or common email provider (gmail, outlook, etc.)"
                : "Use a university email"}
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="username" className="text-sm font-medium flex items-center gap-1.5">
            Username
          </Label>
          <div className="relative group">
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Choose a username"
              required
              className="w-full h-11 pl-4 pr-10 rounded-xl border-muted bg-background/50 transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 group-hover:border-primary/30"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
            />
            <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
            {usernameStatus === "checking" && (
              <div className="absolute inset-y-0 right-3 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {usernameStatus === "available" && (
              <div className="absolute inset-y-0 right-3 flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            )}
            {(usernameStatus === "unavailable" ||
              usernameStatus === "invalid") && (
              <div className="absolute inset-y-0 right-3 flex items-center">
                <XCircle className="h-4 w-4 text-red-500" />
              </div>
            )}
          </div>
          {usernameError && (
            <p className="text-xs text-red-500">{usernameError}</p>
          )}
          {!usernameError && (
            <p className="text-xs text-muted-foreground">
              This will be your public display name
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="password" className="text-sm font-medium flex items-center gap-1.5">
            Password
          </Label>
          <div className="relative group">
            <PasswordInput
              id="password"
              name="password"
              placeholder="Your password"
              minLength={8}
              maxLength={50}
              required
              className="w-full h-11 pl-4 pr-10 rounded-xl border-muted bg-background/50 transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 group-hover:border-primary/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
          </div>
          {passwordError ? (
            <p className="text-xs text-red-500">{passwordError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Must be 8-50 characters with uppercase, lowercase, number, and
              special character
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="confirm_password" className="text-sm font-medium flex items-center gap-1.5">
            Confirm Password
          </Label>
          <div className="relative group">
            <PasswordInput
              id="confirm_password"
              name="confirm_password"
              placeholder="Confirm your password"
              minLength={8}
              maxLength={50}
              required
              className="w-full h-11 pl-4 pr-10 rounded-xl border-muted bg-background/50 transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 group-hover:border-primary/30"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
          </div>
          {validatePasswordMatch() && (
            <p className="text-xs text-red-500">{validatePasswordMatch()}</p>
          )}
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-center mb-4">
        By creating an account, you are agreeing to our{" "}
        <Link
          href="/terms-of-service"
          className="text-primary hover:underline transition-all"
        >
          Terms of Service
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-3 shadow-md hover:shadow-lg"
        disabled={!isFormValid || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing up...
          </>
        ) : (
          "Sign up"
        )}
      </Button>

      {((message.error &&
        !message.error.includes("university/domain isn't supported") &&
        !message.error.includes("This email domain is not supported") &&
        !message.error.includes("Your email domain is not supported") &&
        !message.error.includes("Your email domain or university is not supported") &&
        !message.error.includes("Please use a university email") &&
        !message.error.includes("Please use a university email or a common email provider")
        ) ||
        message.success) && <FormMessage message={message} />}
    </form>
  );
}

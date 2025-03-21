import { notFound } from "next/navigation";

// Define special routes that should be redirected to their original paths
const SPECIAL_ROUTES = [
  "dashboard",
  "sign-in",
  "sign-up",
  "verify-invite",
  "profile",
  "api",
  "academic-integrity",
  "copyright-policy",
  "terms-of-service",
  "pricing",
  "universities",
  "success",
  "forgot-password",
  "reset-password",
  "resources",
  "study-groups",
  "settings",
];

export default function UsernamePage({
  params,
}: {
  params: { username: string };
}) {
  if (!params?.username) {
    notFound();
    return null;
  }

  const { username } = params;

  // Check if this is a special route before making any database calls
  if (SPECIAL_ROUTES.includes(username)) {
    return notFound();
  }

  // Return 404 for any username route
  return notFound();
}

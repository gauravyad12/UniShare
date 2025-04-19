import { redirect } from "next/navigation";

export default function ProfileRedirect({
  params,
}: {
  params: { username: string };
}) {
  // Early return if no username parameter
  if (!params || !params.username) {
    return redirect("/dashboard");
  }

  // Clean the username parameter (remove @ if present)
  const usernameParam = params.username.startsWith("@")
    ? params.username.substring(1)
    : params.username;

  // Redirect to the dashboard profile page with the username as a query parameter
  return redirect(
    `/dashboard/profile?username=${encodeURIComponent(usernameParam)}`,
  );
}

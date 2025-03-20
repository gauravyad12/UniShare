import { redirect } from "next/navigation";

export default function ProfileRedirect({
  params,
}: {
  params: { username: string };
}) {
  // Ensure params exists before accessing username
  if (!params || !params.username) {
    redirect("/");
    return null;
  }

  // Remove @ if it exists and redirect to the standard profile page
  const cleanUsername = params.username.startsWith("@")
    ? params.username.substring(1)
    : params.username;

  redirect(`/profile?username=${cleanUsername}`);
}

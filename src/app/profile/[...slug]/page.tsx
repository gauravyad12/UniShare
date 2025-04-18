import { redirect } from "next/navigation";

export default function ProfileCatchAll({
  params,
}: {
  params: { slug: string[] };
}) {
  // Extract the username from the slug
  const username = params.slug && params.slug.length > 0 ? params.slug[0] : null;
  
  // If we have a username, redirect to the profile page with a query parameter
  if (username) {
    // Clean the username (remove @ if present)
    const cleanUsername = username.startsWith("@")
      ? username.substring(1)
      : username;
      
    return redirect(`/dashboard/profile?username=${encodeURIComponent(cleanUsername)}`);
  }
  
  // If no username is provided, redirect to the dashboard
  return redirect("/dashboard");
}

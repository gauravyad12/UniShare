import { redirect } from "next/navigation";

export default function UserProfileRedirect() {
  // Redirect to dashboard if no username is provided
  redirect("/dashboard");
}

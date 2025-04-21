import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";


export default function UserProfileRedirect() {
  // Redirect to dashboard if no username is provided
  redirect("/dashboard");
}

export const dynamic = "force-dynamic";

import { createClient } from "../../../../utils/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EditProfileFormClient from "@/components/edit-profile-form-client";
export default async function EditProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect if user is not logged in
  if (!user) {
    return redirect("/sign-in?error=Please sign in to access the dashboard");
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>
            Update your profile information and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditProfileFormClient profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}

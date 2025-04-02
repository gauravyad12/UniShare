import { createClient } from "../../../../utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UniShare | Edit Profile",
  description: "Update your profile information and settings",
};

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
          <form
            action="/api/profile/update"
            method="POST"
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    defaultValue={profile?.full_name || ""}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    defaultValue={profile?.username || ""}
                    placeholder="Choose a username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={profile?.bio || ""}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">Profile Picture URL</Label>
                <Input
                  id="avatar_url"
                  name="avatar_url"
                  defaultValue={profile?.avatar_url || ""}
                  placeholder="https://example.com/your-image.jpg"
                />
              </div>
            </div>

            <Button type="submit" className="w-full md:w-auto">
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

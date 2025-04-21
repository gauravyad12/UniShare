export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/server";
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
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CreateStudyGroupForm from "@/components/create-study-group-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UniShare | Create Study Group",
  description: "Create a new study group",
};

export default async function CreateStudyGroupPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user's university
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("university_id, universities(name)")
    .eq("id", user.id)
    .single();

  if (!userProfile?.university_id) {
    return redirect("/dashboard/profile?error=You need to set your university before creating a study group");
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/study-groups">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create Study Group</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>New Study Group</CardTitle>
          <CardDescription>
            Create a study group for {userProfile?.universities?.name || "your university"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateStudyGroupForm universityId={userProfile?.university_id} />
        </CardContent>
      </Card>
    </div>
  );
}

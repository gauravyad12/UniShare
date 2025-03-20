import { createClient } from "../../../../supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Plus, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import StudyGroupCard from "@/components/study-group-card";

export default async function StudyGroupsPage() {
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
    .select("university_id")
    .eq("id", user.id)
    .single();

  // Get study groups for user's university
  const { data: studyGroups } = await supabase
    .from("study_groups")
    .select("*")
    .eq("university_id", userProfile?.university_id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get user's study groups
  const { data: userStudyGroups } = await supabase
    .from("study_group_members")
    .select("study_group_id")
    .eq("user_id", user.id);

  const userGroupIds =
    userStudyGroups?.map((group) => group.study_group_id) || [];

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Study Groups</h1>
          <Button>
            <Users className="mr-2 h-4 w-4" />
            Create Study Group
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search study groups by name, course code, or description..."
            className="pl-10"
          />
        </div>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Groups</TabsTrigger>
          <TabsTrigger value="my-groups">My Groups</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Meetings</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {studyGroups && studyGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studyGroups.map((group) => (
                <StudyGroupCard
                  key={group.id}
                  group={group}
                  isMember={userGroupIds.includes(group.id)}
                />
              ))}
            </div>
          ) : (
            <Card className="bg-muted/40">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
                <Users className="h-12 w-12 text-muted-foreground" />
                <CardTitle>No study groups found</CardTitle>
                <CardDescription>
                  Be the first to create a study group for your university!
                </CardDescription>
                <Button className="mt-2">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Study Group
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-groups" className="space-y-4">
          <Card className="bg-muted/40">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
              <Users className="h-12 w-12 text-muted-foreground" />
              <CardTitle>My Study Groups</CardTitle>
              <CardDescription>
                View and manage the study groups you've joined or created.
              </CardDescription>
              <Button className="mt-2">
                <Plus className="mr-2 h-4 w-4" />
                Join a Group
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card className="bg-muted/40">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <CardTitle>Upcoming Meetings</CardTitle>
              <CardDescription>
                View your scheduled study group meetings and sessions.
              </CardDescription>
              <Button className="mt-2">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

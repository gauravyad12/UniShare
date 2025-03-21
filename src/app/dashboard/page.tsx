import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";
import {
  BookOpen,
  Calendar,
  InfoIcon,
  Lightbulb,
  UserCircle,
  Users,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect if user is not logged in
  if (!user) {
    return redirect("/sign-in?error=Please sign in to access the dashboard");
  }

  // Get user's university
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select(
      "university_id, full_name, username, avatar_url, university:universities(name)",
    )
    .eq("id", user.id)
    .single();

  // If user has no university set, try to detect it from email
  if (userProfile && !userProfile.university_id && user.email) {
    const emailDomain = user.email.split("@")[1];
    if (emailDomain) {
      const { data: universityData } = await supabase
        .from("universities")
        .select("id, name")
        .eq("domain", emailDomain)
        .single();

      if (universityData) {
        // Update user profile with detected university
        await supabase
          .from("user_profiles")
          .update({ university_id: universityData.id })
          .eq("id", user.id);

        // Update local userProfile object
        userProfile.university_id = universityData.id;
        userProfile.university = { name: universityData.name };
      }
    }
  }

  // Get counts for resources and study groups
  const { count: resourceCount } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("university_id", userProfile?.university_id);

  const { count: studyGroupCount } = await supabase
    .from("study_groups")
    .select("*", { count: "exact", head: true })
    .eq("university_id", userProfile?.university_id);

  // Get user's study groups
  const { data: userStudyGroups } = await supabase
    .from("study_group_members")
    .select("study_group_id")
    .eq("user_id", user.id);

  const userGroupCount = userStudyGroups?.length || 0;

  // Get upcoming meetings
  const now = new Date().toISOString();
  const { data: upcomingMeetings } = await supabase
    .from("study_group_meetings")
    .select("*, study_group:study_groups(name)")
    .gt("start_time", now)
    .order("start_time", { ascending: true })
    .limit(3);

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Welcome Section */}
      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">
          Welcome,{" "}
          {userProfile?.full_name ||
            userProfile?.username ||
            user?.user_metadata?.full_name ||
            user?.user_metadata?.username ||
            user.email}
        </h1>
        <div className="bg-secondary/50 text-sm p-3 px-4 rounded-lg text-muted-foreground flex gap-2 items-center">
          <InfoIcon size="14" />
          <span>
            Welcome to {userProfile?.university?.name || "your university"}'s
            study hub
          </span>
        </div>
      </header>

      {/* Quick Actions */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <Button
            asChild
            variant="outline"
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
          >
            <Link href="/dashboard/resources">
              <BookOpen className="h-6 w-6" />
              <span>Browse Resources</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
          >
            <Link href="/dashboard/resources?upload=true">
              <BookOpen className="h-6 w-6" />
              <span>Upload Resource</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
          >
            <Link href="/dashboard/study-groups">
              <Users className="h-6 w-6" />
              <span>Find Study Groups</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
          >
            <Link href="/dashboard/study-groups?create=true">
              <Users className="h-6 w-6" />
              <span>Create Study Group</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10"
          >
            <Link href="/dashboard/invite">
              <UserPlus className="h-6 w-6 text-primary" />
              <span>Invite Friends</span>
            </Link>
          </Button>
        </div>
      </section>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{resourceCount || 0}</p>
            <p className="text-sm text-muted-foreground">Available resources</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/resources">Browse Resources</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Study Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{studyGroupCount || 0}</p>
            <p className="text-sm text-muted-foreground">Active study groups</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/study-groups">Find Groups</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              My Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{userGroupCount}</p>
            <p className="text-sm text-muted-foreground">
              Groups you've joined
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/study-groups?tab=my-groups">
                My Groups
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* User Profile Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserCircle className="w-16 h-16 text-primary" />
              )}
            </div>
            <h3 className="font-semibold text-lg">
              {userProfile?.full_name || "Set your name"}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
            {userProfile?.username && (
              <p className="text-sm">@{userProfile.username}</p>
            )}
            <Button asChild className="mt-4" size="sm">
              <Link href="/dashboard/profile">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Meetings</CardTitle>
            <CardDescription>Your scheduled study sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMeetings && upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => {
                  const startDate = new Date(meeting.start_time);
                  const endDate = new Date(meeting.end_time);
                  return (
                    <div
                      key={meeting.id}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                    >
                      <div className="bg-primary/10 p-2 rounded-md">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{meeting.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {meeting.study_group?.name}
                        </p>
                        <div className="flex items-center mt-2 text-sm">
                          <span>
                            {startDate.toLocaleDateString()} •{" "}
                            {startDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {endDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="font-medium">No upcoming meetings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Join a study group to see scheduled sessions
                </p>
                <Button asChild size="sm">
                  <Link href="/dashboard/study-groups">Find Study Groups</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

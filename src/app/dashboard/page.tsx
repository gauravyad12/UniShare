export const dynamic = "force-dynamic";

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
  CheckSquare,
} from "lucide-react";
import MeetingCarousel from "@/components/meeting-carousel";
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
import MobileDashboardHeader from "@/components/mobile-dashboard-header";
import MobileMeetingsSection from "@/components/mobile-meetings-section";
import MobileResourcesSection from "@/components/mobile-resources-section";
import MobileTodoSection from "@/components/mobile-todo-section";
import MobileActionPopup from "@/components/mobile-action-popup";
import TodoList from "@/components/todo-list";

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

  // Get count of public study groups using a stored procedure
  console.log('Fetching study group count for university:', userProfile?.university_id);

  // Create a function to count public study groups
  const { data: countResult, error: countFunctionError } = await supabase
    .rpc('count_public_study_groups', {
      p_university_id: userProfile?.university_id
    });

  let studyGroupCount = 0;

  if (countFunctionError) {
    console.error("Error fetching study group count:", countFunctionError);

    // Fallback: Use the get_public_study_groups function and count the results
    const { data: publicGroups, error: publicGroupsError } = await supabase
      .rpc('get_public_study_groups', {
        p_university_id: userProfile?.university_id
      });

    if (publicGroupsError) {
      console.error("Error fetching public study groups:", publicGroupsError);
    } else {
      studyGroupCount = publicGroups?.length || 0;
      console.log('Study group count (fallback):', studyGroupCount);
    }
  } else {
    studyGroupCount = countResult;
    console.log('Study group count:', studyGroupCount);
  }

  // Get user's study groups count using a secure function
  const { data: userGroupCountResult, error: userGroupCountError } = await supabase
    .rpc('get_user_study_group_count');

  if (userGroupCountError) {
    console.error("Error fetching user's study group count:", userGroupCountError);
  }

  // Fallback to direct query if the function fails
  let userGroupCount = userGroupCountResult || 0;

  if (userGroupCountError) {
    const { data: userStudyGroups, error: userGroupsError } = await supabase
      .from("study_group_members")
      .select("study_group_id")
      .eq("user_id", user.id);

    if (userGroupsError) {
      console.error("Error fetching user's study groups:", userGroupsError);
    } else {
      userGroupCount = userStudyGroups?.length || 0;
      console.log(`Found ${userGroupCount} groups for user ${user.id} (fallback method)`);
    }
  } else {
    console.log(`User ${user.id} is a member of ${userGroupCount} study groups`);
  }

  // Get both upcoming and past meetings using the custom function
  const { data: allMeetings, error: meetingsError } = await supabase
    .rpc('get_user_meetings');

  if (meetingsError) {
    console.error("Error fetching meetings:", meetingsError);
  }

  // Split meetings into upcoming and past
  const upcomingMeetings = allMeetings?.filter(meeting => !meeting.is_past) || [];
  const pastMeetings = allMeetings?.filter(meeting => meeting.is_past) || [];

  // Sort upcoming meetings by start time (ascending)
  upcomingMeetings.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  // Sort past meetings by start time (descending - most recent first)
  pastMeetings.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  // Get all upcoming meetings for display
  const limitedUpcomingMeetings = upcomingMeetings;
  // Limit past meetings to only the 4 most recent ones
  const limitedPastMeetings = pastMeetings.slice(0, 4);

  // Fetch recent resources for the mobile dashboard
  const { data: recentResources, error: resourcesError } = await supabase
    .from("resources")
    .select("id, title, description, thumbnail_url, external_link, created_at, course_code")
    .eq("university_id", userProfile?.university_id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Map the external_link field to is_external_link for compatibility
  const mappedResources = recentResources?.map(resource => ({
    ...resource,
    is_external_link: !!resource.external_link
  }));

  if (resourcesError) {
    console.error("Error fetching recent resources:", resourcesError);
  }

  // Prepare data for our components

  // Get the user's name for display
  const userName = userProfile?.full_name ||
    userProfile?.username ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.username ||
    user.email || "User";

  // Get the university name
  const universityName = userProfile?.university?.name || "your university";

  return (
    <>
      {/* Mobile view */}
      <div className="md:hidden relative">
        {/* Full page background color */}
        <div className="fixed inset-0 bg-background -z-30" />

        {/* Modern mesh gradient background with animation */}
        <div className="fixed top-0 left-0 right-0 h-[40vh] overflow-hidden -z-20">
          <div className="absolute inset-0 bg-background" />
          <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-3xl mesh-gradient-blob" />
          <div className="absolute top-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-3xl mesh-gradient-blob" />
          <div className="absolute bottom-[-40%] left-[10%] w-[60%] h-[60%] rounded-full bg-secondary/5 blur-3xl mesh-gradient-blob" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

        <MobileDashboardHeader
          userName={userName}
          universityName={universityName}
          avatarUrl={userProfile?.avatar_url}
          resourceCount={resourceCount || 0}
          studyGroupCount={studyGroupCount || 0}
          username={userProfile?.username}
        />

        <div className="px-4 -mt-4">
          <MobileMeetingsSection
            upcomingMeetings={limitedUpcomingMeetings}
            pastMeetings={limitedPastMeetings}
          />

          <MobileResourcesSection
            resources={mappedResources || []}
          />

          <MobileTodoSection />
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden md:flex container mx-auto px-4 py-8 flex-col gap-8">
        {/* Welcome Section */}
        <header>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">
              Welcome, {userName}
            </h1>
          </div>
          <div className="bg-secondary/50 text-sm p-3 px-4 rounded-lg text-muted-foreground flex gap-2 items-center">
            <InfoIcon size="14" />
            <span>
              Welcome to {universityName}'s study hub
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
            <Link href="/dashboard/study-groups/create">
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
            <p className="text-sm text-muted-foreground">Public study groups</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/study-groups?tab=all">Find Groups</Link>
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
              Study groups you've joined
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

      {/* User Profile and To-Do List Section */}
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
            <CardTitle>To-Do List</CardTitle>
            <CardDescription>Manage your tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <TodoList />
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/todos">View All Tasks</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Study Group Meetings - Full Width */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Study Group Meetings</CardTitle>
            <CardDescription>Your scheduled study sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {(limitedUpcomingMeetings.length > 0 || limitedPastMeetings.length > 0) ? (
              <div className="space-y-6">
                {/* Upcoming Meetings Section */}
                {limitedUpcomingMeetings.length > 0 && (
                  <MeetingCarousel meetings={limitedUpcomingMeetings} isPast={false} />
                )}

                {/* Past Meetings Section */}
                {limitedPastMeetings.length > 0 && (
                  <MeetingCarousel meetings={limitedPastMeetings} isPast={true} />
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="font-medium">No meetings found</h3>
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
    </>
  );
}

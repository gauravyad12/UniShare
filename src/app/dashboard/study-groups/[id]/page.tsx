export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
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
import {
  Calendar,
  MessageSquare,
  Users,
  FileText,
  Clock,
  ArrowLeft,
  Lock,
  Unlock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import RealtimeUnreadBadgeWrapper from "@/components/realtime-unread-badge-wrapper";
import { Metadata } from "next";

interface PageProps {
  params: {
    id: string;
  };
  searchParams?: {
    error?: string;
  };
}

export const metadata: Metadata = {
  title: "UniShare | Study Group",
  description: "View study group details",
};

export default async function StudyGroupPage({ params, searchParams }: PageProps) {
  const supabase = await createClient();
  const groupId = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get the study group
  const { data: studyGroup, error: groupError } = await supabase
    .from("study_groups")
    .select("*, universities(name)")
    .eq("id", groupId)
    .single();

  if (groupError || !studyGroup) {
    return notFound();
  }

  // Check if the user is a member of the study group
  const { data: membership, error: membershipError } = await supabase
    .from("study_group_members")
    .select("role")
    .eq("study_group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isMember = !!membership;
  const isAdmin = membership?.role === "admin";

  // Get group members
  const { data: members } = await supabase
    .from("study_group_members")
    .select("user_id, role, joined_at, user_profiles(full_name, username, avatar_url)")
    .eq("study_group_id", groupId)
    .order("role", { ascending: true })
    .order("joined_at", { ascending: true });

  // Get group resources
  const { data: resources } = await supabase
    .from("study_group_resources")
    .select("resource_id, added_at, resources(*)")
    .eq("study_group_id", groupId)
    .order("added_at", { ascending: false });

  // Format date
  const formattedDate = new Date(studyGroup.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format last message time
  const lastMessageTime = studyGroup.last_message_at
    ? formatDistanceToNow(new Date(studyGroup.last_message_at), { addSuffix: true })
    : null;

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        {searchParams?.error && (
          <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
            {searchParams.error}
          </div>
        )}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/dashboard/study-groups">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">{studyGroup.name}</h1>
            <Badge variant={studyGroup.is_private ? "secondary" : "outline"}>
              {studyGroup.is_private ? (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </>
              ) : (
                <>
                  <Unlock className="h-3 w-3 mr-1" />
                  Open
                </>
              )}
            </Badge>
            {studyGroup.course_code && (
              <Badge variant="outline">{studyGroup.course_code}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isMember ? (
              <Button asChild className="relative">
                <Link href={`/dashboard/study-groups?view=${groupId}&chat=true`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Group Chat
                  <RealtimeUnreadBadgeWrapper
                    groupId={groupId}
                    userId={user.id}
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs"
                  />
                </Link>
              </Button>
            ) : (
              <Button>
                Join Group
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{studyGroup.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{studyGroup.member_count || 0} members</span>
                </div>
                {studyGroup.message_count > 0 && (
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span>{studyGroup.message_count} messages</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Created on {formattedDate}</span>
                </div>
                {lastMessageTime && (
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span>Last message {lastMessageTime}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="resources" className="mt-8">
            <TabsList>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="meetings">Meetings</TabsTrigger>
            </TabsList>
            <TabsContent value="resources" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Shared Resources</CardTitle>
                  {isMember && (
                    <Button size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Add Resource
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {resources && resources.length > 0 ? (
                    <div className="space-y-4">
                      {resources.map((item) => (
                        <div key={item.resource_id} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <h3 className="font-medium">{item.resources.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.resources.description}</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/resources?view=${item.resource_id}`}>
                              View
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No resources have been shared yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="meetings" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Upcoming Meetings</CardTitle>
                  {isMember && (
                    <Button size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Meeting
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No upcoming meetings scheduled.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                {studyGroup.member_count || 0} of {studyGroup.max_members || "∞"} members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {members && members.length > 0 ? (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.user_id} className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {member.user_profiles?.avatar_url ? (
                          <img
                            src={member.user_profiles.avatar_url}
                            alt={member.user_profiles.full_name || member.user_profiles.username || "User"}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.user_profiles?.full_name || member.user_profiles?.username || "Unknown User"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.role === "admin" ? "Admin" : "Member"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No members found.</p>
              )}
            </CardContent>
            {isMember && isAdmin && (
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Members
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

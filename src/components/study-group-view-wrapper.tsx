"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
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
  Unlock,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import ShareStudyGroupButton from "@/components/share-study-group-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StudyGroupViewWrapperProps {
  group: any;
  isOwner?: boolean;
}

export default function StudyGroupViewWrapper({
  group: initialGroup,
}: StudyGroupViewWrapperProps) {
  const router = useRouter();
  const [group, setGroup] = useState(initialGroup);
  console.log('StudyGroupViewWrapper rendering with group:', group);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  // Loading state is used in useEffect but not in rendering
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Format date
  const formattedDate = new Date(group.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format last message time
  const lastMessageTime = group.last_message_at
    ? formatDistanceToNow(new Date(group.last_message_at), { addSuffix: true })
    : null;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Check if user is a member using stored procedure
        const { data: membershipData, error: membershipError } = await supabase
          .rpc('check_study_group_membership', {
            p_group_id: group.id,
            p_user_id: user.id
          });

        if (membershipError) {
          console.error('Error checking membership:', membershipError);
        } else if (membershipData && membershipData.length > 0) {
          const membership = membershipData[0];
          setIsMember(membership.is_member);
          setIsAdmin(membership.role === 'admin');
        }
      }

      // Get members using stored procedure
      const { data: membersData, error: membersError } = await supabase
        .rpc('get_study_group_members', {
          p_group_id: group.id
        });

      if (membersError) {
        console.error('Error fetching members:', membersError);
      } else {
        setMembers(membersData || []);
      }

      // Get resources using stored procedure
      const { data: resourcesData, error: resourcesError } = await supabase
        .rpc('get_study_group_resources', {
          p_group_id: group.id
        });

      if (resourcesError) {
        console.error('Error fetching resources:', resourcesError);
      } else {
        setResources(resourcesData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [group.id]);

  const handleJoinGroup = async () => {
    if (!userId) {
      router.push("/sign-in");
      return;
    }

    try {
      // Use the API endpoint instead of direct database access
      // This ensures proper handling of member counts through the trigger
      const response = await fetch(`/api/study-groups/${group.id}/join`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join study group");
      }

      console.log("Successfully joined the study group");

      // Update local state
      setIsMember(true);

      // Immediately update the member count in the UI
      setGroup({
        ...group,
        member_count: (group.member_count || 0) + 1
      });

      // Also manually increment the member count in the database
      try {
        const { error } = await supabase
          .from("study_groups")
          .update({
            member_count: (group.member_count || 0) + 1
          })
          .eq("id", group.id);

        if (error) {
          console.error("Error manually incrementing member count:", error);
        }
      } catch (error) {
        console.error("Error manually incrementing member count:", error);
      }

      // Fetch updated member list
      const { data: membersData } = await supabase
        .rpc('get_study_group_members', {
          p_group_id: group.id
        });

      if (membersData) {
        setMembers(membersData);
      }

      // Refresh the page to update the UI
      router.refresh();
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };

  const handleClose = () => {
    // Remove the view parameter from the URL
    const url = new URL(window.location.href);
    url.searchParams.delete("view");
    router.push(url.pathname + url.search);
  };

  return (
    <Card className="relative w-full max-w-5xl mx-auto my-8 border-2 border-primary/20">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 z-10"
        onClick={handleClose}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold truncate pr-16 max-w-full">{group.name}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant={group.is_private ? "secondary" : "outline"}>
                {group.is_private ? (
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
              {group.course_code && (
                <Badge variant="outline">{group.course_code}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMember ? (
              <>
                <Button asChild className="relative">
                  <Link href={`/dashboard/study-groups?view=${group.id}&chat=true`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Group Chat
                  </Link>
                </Button>
                {!group.is_private && (
                  <ShareStudyGroupButton
                    groupId={group.id}
                    groupName={group.name}
                    groupDescription={group.description}
                    className="relative"
                  />
                )}
              </>
            ) : (
              <Button onClick={handleJoinGroup}>
                Join Group
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Created on {formattedDate}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div>
              <h2 className="text-lg font-semibold mb-2">About</h2>
              <p className="mb-4">{group.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{members.length || 0} members</span>
                </div>
                {group.message_count > 0 && (
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span>{group.message_count} messages</span>
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
            </div>

            <Tabs defaultValue="resources" className="mt-8">
              <TabsList>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="meetings">Meetings</TabsTrigger>
              </TabsList>
              <TabsContent value="resources" className="mt-4">
                <div>
                  <div className="flex flex-row items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Shared Resources</h3>
                    {isMember && (
                      <Button size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Add Resource
                      </Button>
                    )}
                  </div>
                  {resources && resources.length > 0 ? (
                    <div className="space-y-4">
                      {resources.map((item) => (
                        <div key={item.resource_id} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <h3 className="font-medium">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
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
                </div>
              </TabsContent>
              <TabsContent value="meetings" className="mt-4">
                <div>
                  <div className="flex flex-row items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Upcoming Meetings</h3>
                    {isMember && (
                      <Button size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Meeting
                      </Button>
                    )}
                  </div>
                  <p className="text-muted-foreground">No upcoming meetings scheduled.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Members</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {members.length || 0} of {group.max_members || "∞"} members
              </p>
              {members && members.length > 0 ? (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.user_id} className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <Avatar className="h-8 w-8 avatar">
                          {member.avatar_url ? (
                            <AvatarImage
                              src={member.avatar_url}
                              alt={member.full_name || member.username || "User"}
                              className="object-cover"
                            />
                          ) : (
                            <AvatarFallback>
                              <Users className="h-4 w-4" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.full_name || member.username || "Unknown User"}
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
            </div>
            {isMember && isAdmin && (
              <Button variant="outline" size="sm" className="w-full mt-4">
                <Users className="h-4 w-4 mr-2" />
                Manage Members
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleClose}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Study Groups
        </Button>
        {isMember && (
          <Button asChild>
            <Link href={`/dashboard/study-groups?view=${group.id}`}>
              View Full Page
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

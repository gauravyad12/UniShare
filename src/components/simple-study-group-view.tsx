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
  MessageSquare,
  Users,
  Clock,
  ArrowLeft,
  Lock,
  Unlock,
  X,
  FileText,
  Calendar,
  Loader2,
  MoreVertical,
  LogOut,
  Trash2,
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import StudyGroupManagement from "./study-group-management";
import StudyGroupInvitations from "./study-group-invitations";
import AddResourceToGroup from "./add-resource-to-group";
import ScheduleGroupMeeting from "./schedule-group-meeting";
import GroupMeetingsList from "./group-meetings-list";
import ShareStudyGroupButton from "./share-study-group-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SimpleStudyGroupViewProps {
  group: any;
}

export default function SimpleStudyGroupView({
  group,
}: SimpleStudyGroupViewProps) {
  const router = useRouter();
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Used for conditional rendering below
  const [userId, setUserId] = useState<string | null>(null);
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [refreshMeetings, setRefreshMeetings] = useState(0);
  const [refreshResources, setRefreshResources] = useState(0);
  const [removingResourceId, setRemovingResourceId] = useState<string | null>(null);

  console.log('SimpleStudyGroupView rendering with group:', group);

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

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setIsCreator(user.id === group.created_by);

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
        console.log('Members data structure:', membersData);
        setMembers(membersData || []);
      }

      // Get resources using the API endpoint instead of stored procedure
      await fetchResources();

      setLoading(false);
    };

    fetchData();
  }, [group.id, group.created_by]);

  // Separate useEffect for refreshing resources
  useEffect(() => {
    if (refreshResources > 0) {
      console.log('Refreshing resources due to refreshResources change:', refreshResources);
      fetchResources();
    }
  }, [refreshResources, group.id]);

  // Function to fetch resources
  const fetchResources = async () => {
    try {
      console.log(`Fetching resources for group ${group.id}`);
      const response = await fetch(`/api/study-groups/${group.id}/resources`);

      // Log the raw response for debugging
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response (${response.status}):`, errorText);
        throw new Error(`Failed to fetch resources: ${response.status}`);
      }

      const data = await response.json();
      console.log('Resources fetched:', data.resources?.length || 0);
      console.log('Resource data sample:', data.resources?.slice(0, 2) || 'No resources');

      setResources(data.resources || []);
    } catch (resourcesError) {
      console.error('Error fetching resources:', resourcesError);
    }
  };

  const handleJoinGroup = async () => {
    if (!userId) {
      router.push("/sign-in");
      return;
    }

    try {
      setJoiningGroup(true);

      // Use the API endpoint to join the group instead of direct database access
      // This avoids the RLS recursion issue
      const response = await fetch('/api/study-groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: group.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Join group response error:', data);

        // If the error is related to the stored procedure, try the direct join endpoint
        if (data.error && data.error.includes('stored procedure')) {
          console.log('Trying direct join endpoint as fallback');

          const directResponse = await fetch('/api/study-groups/join-direct', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              groupId: group.id
            })
          });

          const directData = await directResponse.json();

          if (!directResponse.ok) {
            console.error('Direct join response error:', directData);
            throw new Error(directData.error || 'Failed to join group directly');
          }

          // If we get here, the direct join was successful
          return directData;
        }

        throw new Error(data.error || 'Failed to join group');
      }

      if (data.alreadyMember) {
        console.log("User is already a member of this study group");
        setJoiningGroup(false);
        return;
      }

      console.log("Successfully joined the study group");

      setIsMember(true);
      setMembers([...members, {
        user_id: userId,
        role: "member",
        joined_at: new Date().toISOString(),
        full_name: "You",
        username: "you",
        avatar_url: null
      }]);

      // Refresh the page to update the UI
      router.refresh();
    } catch (error) {
      console.error("Error joining group:", error);

      // Try one more time with the direct endpoint if we haven't already
      if (error instanceof Error && error.message.includes('Failed to join group') && !error.message.includes('directly')) {
        try {
          console.log('Trying direct join endpoint as last resort');

          const directResponse = await fetch('/api/study-groups/join-direct', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              groupId: group.id
            })
          });

          const directData = await directResponse.json();

          if (!directResponse.ok) {
            throw new Error(directData.error || 'Failed to join group directly');
          }

          // Success!
          console.log("Successfully joined the study group via direct endpoint");

          setIsMember(true);
          setMembers([...members, {
            user_id: userId,
            role: "member",
            joined_at: new Date().toISOString(),
            full_name: "You",
            username: "you",
            avatar_url: null
          }]);

          // Refresh the page to update the UI
          router.refresh();
          return;
        } catch (directError) {
          console.error("Error in direct join fallback:", directError);
        }
      }

      console.error("Failed to join the study group:", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setJoiningGroup(false);
    }
  };

  const handleClose = () => {
    // Remove the view parameter from the URL
    const url = new URL(window.location.href);
    url.searchParams.delete("view");
    router.push(url.pathname + url.search);
  };

  const handleLeaveGroup = async () => {
    if (!userId || !isMember) return;

    try {
      setLeavingGroup(true);

      // Use the new leave endpoint instead of the DELETE endpoint
      const response = await fetch('/api/study-groups/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: group.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave the group');
      }

      console.log("Successfully left the study group");

      setIsMember(false);
      setMembers(members.filter(member => member.user_id !== userId));

      // Refresh the page to update the UI
      router.refresh();
    } catch (error) {
      console.error("Error leaving group:", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLeavingGroup(false);
    }
  };

  const handleRemoveResource = async (resourceId: string) => {
    if (!userId || !isMember) return;

    try {
      setRemovingResourceId(resourceId);

      // Call the API to remove the resource
      const response = await fetch('/api/study-groups/remove-resource', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: group.id,
          resourceId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove the resource');
      }

      console.log("Resource successfully removed from the group");

      // Update the resources list
      setResources(resources.filter(resource => resource.resource_id !== resourceId));

    } catch (error) {
      console.error("Error removing resource:", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setRemovingResourceId(null);
    }
  };

  if (loading) {
    return (
      <Card className="relative w-full max-w-5xl mx-auto my-8 border-2 border-primary/20 px-2 sm:px-4 md:px-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="h-8 w-64 bg-muted rounded"></div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading study group details...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative w-full max-w-5xl mx-auto my-8 border-2 border-primary/20 px-2 sm:px-4 md:px-6">
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
        {(isAdmin || isCreator) && (
          <StudyGroupManagement
            groupId={group.id}
            isAdmin={isAdmin}
            isCreator={isCreator}
            members={members}
            group={group}
            onMembersUpdated={() => {
              // Refresh the members list
              const fetchMembers = async () => {
                const supabase = createClient();
                const { data: membersData } = await supabase
                  .rpc('get_study_group_members', {
                    p_group_id: group.id
                  });
                if (membersData) {
                  setMembers(membersData);
                }
              };
              fetchMembers();
            }}
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <CardHeader className="pb-2">
        <div className="mb-2"> {/* Removed flex and right padding */}
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
        </div>
        <CardDescription className="mb-4">
          Created on {formattedDate}
        </CardDescription>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            {isMember || isCreator ? (
              <>
                <Button className="relative" onClick={() => {
                  // Create a chat URL parameter
                  const url = new URL(window.location.href);
                  url.searchParams.set("chat", "true");
                  router.push(url.toString());
                }}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Group Chat
                </Button>
                {!group.is_private && (
                  <ShareStudyGroupButton
                    groupId={group.id}
                    groupName={group.name}
                    groupDescription={group.description}
                    className="relative"
                  />
                )}
                {isMember && !isCreator && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 flex items-center"
                        onClick={handleLeaveGroup}
                        disabled={leavingGroup}
                      >
                        {leavingGroup ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Leaving...</span>
                          </>
                        ) : (
                          <>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Leave Group</span>
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            ) : (
              <Button onClick={handleJoinGroup} disabled={joiningGroup}>
                {joiningGroup ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>Join Group</>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <div>
              <h2 className="text-lg font-semibold mb-2">About</h2>
              <p className="mb-4">{group.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{members.length} of {group.max_members || "∞"} members</span>
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
          </div>

          <div className="border-l pl-6 md:pl-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Members</h2>
              <p className="text-sm text-muted-foreground mb-2">
                {members.length} of {group.max_members || "∞"} members
              </p>
              {members && members.length > 0 ? (
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                  {members.map((member) => (
                    <div key={member.user_id} className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={member.avatar_url || undefined}
                            alt={member.full_name || member.username || "User"}
                          />
                          <AvatarFallback className="text-xs">
                            {member.full_name
                              ? member.full_name.substring(0, 2).toUpperCase()
                              : member.username
                                ? member.username.substring(0, 2).toUpperCase()
                                : "UN"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.full_name || member.username || "Unknown User"}
                          {member.user_id === group.created_by && (
                            <span className="ml-2 text-xs text-primary">(Creator)</span>
                          )}
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
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-2 pb-4">
        <Button variant="outline" onClick={handleClose}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Study Groups
        </Button>
      </CardFooter>

      {/* Resources and Meetings in a separate card */}
      <Card className="mt-4 mb-8 w-full max-w-5xl mx-auto px-0 sm:px-4 md:px-6">
        <CardHeader className="pb-2 px-3 sm:px-6">
          <h2 className="text-xl font-semibold">Group Resources & Meetings</h2>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <Tabs defaultValue="resources">
            <TabsList>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="meetings">Meetings</TabsTrigger>
              {group.is_private && (
                <TabsTrigger value="invitations">Invitations</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="resources" className="mt-4">
              <div>
                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-4 gap-2">
                  <h3 className="text-lg font-semibold">Shared Resources</h3>
                  {isMember && (
                    <AddResourceToGroup
                      groupId={group.id}
                      onResourceAdded={() => {
                        // Refresh resources list
                        setRefreshResources(prev => prev + 1);
                      }}
                    />
                  )}
                </div>
                {resources && resources.length > 0 ? (
                  <div className="space-y-4">
                    {resources.map((item) => (
                      <div key={item.resource_id || item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{item.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                          <div className="flex flex-col xs:flex-row gap-1 xs:gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Added by {item.creator_full_name || item.creator_username || "Unknown"}
                            </span>
                            {item.resource_creator_username && (
                              <span className="text-xs text-muted-foreground xs:ml-0">
                                Created by {item.resource_creator_full_name || item.resource_creator_username}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 self-start sm:self-center mt-2 sm:mt-0">
                          {isMember && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveResource(item.resource_id)}
                              disabled={removingResourceId === item.resource_id}
                              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950/30"
                            >
                              {removingResourceId === item.resource_id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-1 sm:mr-0" />
                                  <span className="sm:hidden">Removing...</span>
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-1 sm:mr-0" />
                                  <span className="sm:hidden">Remove</span>
                                </>
                              )}
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/resources?view=${item.resource_id}`}>
                              <span className="sm:hidden">View</span>
                              <Eye className="h-4 w-4 hidden sm:block" />
                            </Link>
                          </Button>
                        </div>
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
                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-4 gap-2">
                  <h3 className="text-lg font-semibold">Upcoming Meetings</h3>
                  {isMember && (
                    <ScheduleGroupMeeting
                      groupId={group.id}
                      onMeetingScheduled={() => {
                        // Refresh meetings list
                        setRefreshMeetings(prev => prev + 1);
                      }}
                    />
                  )}
                </div>
                <GroupMeetingsList
                  groupId={group.id}
                  refreshTrigger={refreshMeetings}
                />
              </div>
            </TabsContent>
            {group.is_private && (
              <TabsContent value="invitations" className="mt-4">
                <StudyGroupInvitations
                  groupId={group.id}
                  isAdmin={isAdmin || isCreator}
                />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>


    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
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
import { Calendar, Plus, Search, Users, Loader2, Link as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import StudyGroupCard from "@/components/study-group-card";

export default function StudyGroupsClient({ tab = "all" }: { tab?: string }) {
  const { toast } = useToast();
  console.log('StudyGroupsClient rendering with tab:', tab);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        // Get the Supabase client for direct queries if needed
        const supabase = createClient();

        // Fetch public study groups
        const publicResponse = await fetch('/api/study-groups/list');
        const publicResult = await publicResponse.json();

        // Fetch user's study groups (including private ones) from dedicated endpoint
        let myGroups = [];
        try {
          const myGroupsResponse = await fetch('/api/study-groups/my-groups');
          const myGroupsResult = await myGroupsResponse.json();
          myGroups = myGroupsResult.myGroups || [];
          console.log('API returned groups:', myGroups.length);
        } catch (err) {
          console.error('Error fetching from my-groups API:', err);
        }

        if (myGroups.length === 0) {
          console.log('API returned no groups, trying direct query');

          try {
            // Get the current user
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
              console.log('Direct query: User authenticated', user.id);

              try {
                // Get all study group IDs the user is a member of
                const { data: memberGroups, error: memberError } = await supabase
                  .from("study_group_members")
                  .select("study_group_id")
                  .eq("user_id", user.id);

                if (memberError) {
                  console.error('Direct query: Error fetching memberships:', memberError);
                } else {
                  const memberGroupIds = memberGroups?.map(g => g.study_group_id) || [];
                  console.log('Direct query found memberships:', memberGroupIds);

                  // Fetch full details of all these groups
                  if (memberGroupIds.length > 0) {
                    try {
                      // Try to get all groups at once
                      const { data: directGroups, error: groupsError } = await supabase
                        .from("study_groups")
                        .select("*")
                        .in("id", memberGroupIds)
                        .order("created_at", { ascending: false });

                      if (groupsError) {
                        console.error('Direct query: Error fetching groups:', groupsError);
                      } else if (directGroups && directGroups.length > 0) {
                        console.log('Direct query found groups:', directGroups.length);
                        myGroups = directGroups;
                      }
                    } catch (err) {
                      console.error('Direct query: Exception fetching groups:', err);
                    }

                    // If still no groups, try one by one
                    if (myGroups.length === 0) {
                      console.log('Trying to fetch groups one by one');
                      const oneByOneGroups = [];

                      for (const groupId of memberGroupIds) {
                        try {
                          const { data: group } = await supabase
                            .from("study_groups")
                            .select("*")
                            .eq("id", groupId)
                            .single();

                          if (group) {
                            oneByOneGroups.push(group);
                            console.log(`Found group: ${group.id} - ${group.name} (private: ${group.is_private})`);
                          }
                        } catch (err) {
                          console.error(`Error fetching group ${groupId}:`, err);
                        }
                      }

                      if (oneByOneGroups.length > 0) {
                        console.log('Found groups one by one:', oneByOneGroups.length);
                        myGroups = oneByOneGroups;
                      }
                    }
                  }
                }
              } catch (err) {
                console.error('Direct query: Exception in membership fetch:', err);
              }
            }
          } catch (err) {
            console.error('Direct query: Exception getting user:', err);
          }
        }

        // Combine the results
        const result = {
          studyGroups: publicResult.studyGroups || [],
          userGroupIds: publicResult.userGroupIds || [],
          myStudyGroups: myGroups
        };

        // Log the data for debugging
        console.log('Combined study groups data:', {
          studyGroups: result.studyGroups.length,
          userGroupIds: result.userGroupIds.length,
          myStudyGroups: result.myStudyGroups.length,
          privateGroups: result.myStudyGroups.filter((g: any) => g.is_private).length
        });

        // Log details of private groups
        const privateGroups = result.myStudyGroups.filter((g: any) => g.is_private);
        if (privateGroups.length > 0) {
          console.log('Private groups found:', privateGroups.map((g: any) => ({ id: g.id, name: g.name })));
        } else {
          console.log('No private groups found');
        }

        setData(result);

        // Initialize filtered groups
        setFilteredGroups(result.studyGroups || []);
        setFilteredMyGroups(result.myStudyGroups || []);
      } catch (error) {
        console.error('Error fetching study groups:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="h-10 w-48 bg-muted animate-pulse rounded"></div>
            <div className="h-10 w-32 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
        </div>

        <div className="h-10 w-64 bg-muted animate-pulse rounded-md mb-6"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-48 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const { studyGroups = [], userGroupIds = [], myStudyGroups = [] } = data || {};

  // Log the actual data being used for rendering
  console.log('Rendering with data:', {
    studyGroups: studyGroups.map(g => ({ id: g.id, name: g.name, is_private: g.is_private })),
    myStudyGroups: myStudyGroups.map(g => ({ id: g.id, name: g.name, is_private: g.is_private })),
    userGroupIds
  });

  // Make sure userGroupIds includes all IDs from myStudyGroups
  const myGroupIds = myStudyGroups.map((group: any) => group.id);
  const allUserGroupIds = [...new Set([...userGroupIds, ...myGroupIds])];

  console.log('Updated user group IDs:', allUserGroupIds);



  // Function to handle joining a group with an invitation code
  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invitation code",
        variant: "destructive",
      });
      return;
    }

    try {
      setJoiningGroup(true);

      const response = await fetch("/api/study-groups/invitations/use", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: inviteCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join study group");
      }

      toast({
        title: "Success!",
        description: data.message || "You have successfully joined the study group",
      });

      // Close the dialog
      setJoinDialogOpen(false);
      setInviteCode("");

      // Redirect to the study group page
      router.push(`/dashboard/study-groups?view=${data.studyGroupId}`);
    } catch (error) {
      console.error("Error joining study group:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join study group",
        variant: "destructive",
      });
    } finally {
      setJoiningGroup(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Study Groups</h1>
          <div className="flex gap-2">
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <LinkIcon className="mr-2 h-4 w-4" /> Join with Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Private Study Group</DialogTitle>
                  <DialogDescription>
                    Enter an invitation code to join a private study group.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="inviteCode" className="text-right">
                      Invitation Code
                    </label>
                    <Input
                      id="inviteCode"
                      placeholder="Enter code"
                      className="col-span-3"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleJoinGroup} disabled={joiningGroup || !inviteCode.trim()}>
                    {joiningGroup ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Users className="mr-2 h-4 w-4" />
                        Join Group
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={() => router.push('/dashboard/study-groups/create')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search study groups by name, course code, or description..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Groups</TabsTrigger>
          <TabsTrigger value="my-groups">My Groups</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Meetings</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {studyGroups && studyGroups.length > 0 && studyGroups.filter((group: any) => {
            if (searchQuery.trim() === '') return true;
            const query = searchQuery.toLowerCase().trim();
            return (
              group.name?.toLowerCase().includes(query) ||
              group.description?.toLowerCase().includes(query) ||
              group.course_code?.toLowerCase().includes(query)
            );
          }).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studyGroups.filter((group: any) => {
                if (searchQuery.trim() === '') return true;
                const query = searchQuery.toLowerCase().trim();
                return (
                  group.name?.toLowerCase().includes(query) ||
                  group.description?.toLowerCase().includes(query) ||
                  group.course_code?.toLowerCase().includes(query)
                );
              }).map((group: any) => (
                <div key={group.id}>
                  <StudyGroupCard
                    group={group}
                    isMember={allUserGroupIds.includes(group.id)}
                    onView={(id) => router.push(`/dashboard/study-groups?view=${id}`)}
                    onJoin={(id) => router.push(`/dashboard/study-groups?view=${id}`)}
                  />
                </div>
              ))}
            </div>
          ) : studyGroups && studyGroups.length > 0 && searchQuery.trim() !== '' ? (
            <Card className="bg-muted/40">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
                <Users className="h-12 w-12 text-muted-foreground" />
                <CardTitle>No study groups match your search</CardTitle>
                <CardDescription>Try a different search term or create a new group</CardDescription>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
                <Button className="mt-2" onClick={() => router.push('/dashboard/study-groups/create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Study Group
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/40">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
                <Users className="h-12 w-12 text-muted-foreground" />
                <CardTitle>No study groups found</CardTitle>
                <CardDescription>Be the first to create a study group for your university!</CardDescription>
                <Button className="mt-2" onClick={() => router.push('/dashboard/study-groups/create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Study Group
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-groups" className="space-y-4">
          {myStudyGroups && myStudyGroups.length > 0 && myStudyGroups.filter((group: any) => {
            if (searchQuery.trim() === '') return true;
            const query = searchQuery.toLowerCase().trim();
            return (
              group.name?.toLowerCase().includes(query) ||
              group.description?.toLowerCase().includes(query) ||
              group.course_code?.toLowerCase().includes(query)
            );
          }).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Log each group as it's being rendered */}
              {myStudyGroups.filter((group: any) => {
                if (searchQuery.trim() === '') return true;
                const query = searchQuery.toLowerCase().trim();
                return (
                  group.name?.toLowerCase().includes(query) ||
                  group.description?.toLowerCase().includes(query) ||
                  group.course_code?.toLowerCase().includes(query)
                );
              }).map((group: any) => {
                console.log('Rendering group in My Groups tab:', {
                  id: group.id,
                  name: group.name,
                  is_private: group.is_private
                });
                return (
                  <div key={group.id}>
                    <StudyGroupCard
                      key={group.id}
                      group={group}
                      isMember={true}
                      onView={(id) => router.push(`/dashboard/study-groups?view=${id}`)}
                    />
                  </div>
                );
              })}
            </div>
          ) : myStudyGroups && myStudyGroups.length > 0 && searchQuery.trim() !== '' ? (
            <Card className="bg-muted/40">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
                <Users className="h-12 w-12 text-muted-foreground" />
                <CardTitle>No study groups match your search</CardTitle>
                <CardDescription>Try a different search term or join a new group</CardDescription>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
                <Button className="mt-2" onClick={() => setJoinDialogOpen(true)}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Join with Code
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/40">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
                <Users className="h-12 w-12 text-muted-foreground" />
                <CardTitle>No Study Groups Yet</CardTitle>
                <CardDescription>You haven't joined any study groups yet.</CardDescription>
                <Button className="mt-2" onClick={() => setJoinDialogOpen(true)}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Join with Code
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card className="bg-muted/40">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <CardTitle>Upcoming Meetings</CardTitle>
              <CardDescription>
                View your scheduled study group meetings and sessions.
              </CardDescription>
              <Button className="mt-2" onClick={() => router.push('/dashboard/study-groups/create')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Study Group
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

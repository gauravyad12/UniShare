"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserCircle,
  MapPin,
  Calendar,
  BookOpen,
  Users,
  CheckCircle,
  UserPlus,
  UsersRound,
} from "lucide-react";
import ResourceCard from "@/components/resource-card";
import StudyGroupCard from "@/components/study-group-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FollowButton } from "@/components/follow-button";
import { Card, CardContent } from "@/components/ui/card";
import ShareProfileButton from "@/components/share-profile-button";

export default function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [studyGroups, setStudyGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCurrentUserProfile, setIsCurrentUserProfile] = useState(false);
  const [profileHidden, setProfileHidden] = useState(false);
  const [followStats, setFollowStats] = useState({
    followersCount: 0,
    followingCount: 0,
    isFollowing: false,
  });

  // Handle follow status changes
  const handleFollowStatusChange = (status) => {
    console.log("Follow status changed:", status);
    setFollowStats(status);
  };
  const username = params.username;

  // Fetch follow stats separately
  useEffect(() => {
    let isMounted = true;

    if (profile && currentUser) {
      const fetchFollowStats = async () => {
        try {
          // For the current user's own profile, use the public stats API
          if (isCurrentUserProfile) {
            const response = await fetch(
              `/api/users/${profile.id}/follow-stats`,
              {
                headers: {
                  "Cache-Control": "no-cache",
                  Pragma: "no-cache",
                },
                cache: "no-store",
              },
            );

            if (!isMounted) return;

            if (response.ok) {
              const data = await response.json();
              console.log("Own profile follow stats fetched:", data);
              setFollowStats({
                isFollowing: false, // Can't follow yourself
                followersCount: data.followersCount || 0,
                followingCount: data.followingCount || 0,
              });
            }
          } else {
            // For other users' profiles, use the follow status API
            const response = await fetch(
              `/api/users/${profile.id}/follow/status`,
              {
                headers: {
                  "Cache-Control": "no-cache",
                  Pragma: "no-cache",
                },
                cache: "no-store",
              },
            );

            if (!isMounted) return;

            if (response.ok) {
              const data = await response.json();
              console.log("Other user follow stats fetched:", data);
              setFollowStats({
                isFollowing: data.isFollowing,
                followersCount: data.followersCount || 0,
                followingCount: data.followingCount || 0,
              });
            }
          }
        } catch (error) {
          console.error("Error fetching follow stats:", error);
        }
      };

      fetchFollowStats();
    }

    return () => {
      isMounted = false;
    };
  }, [profile, currentUser, isCurrentUserProfile]);

  useEffect(() => {
    console.log("Profile page mounted for username:", username);
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        setCurrentUser(userData.user);

        // Get profile by username
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("*, university:universities(name)")
          .eq("username", username)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setIsLoading(false);
          return;
        }

        console.log("Profile data fetched:", profileData);
        setProfile(profileData);

        // Determine if this is the current user's profile
        const isOwnProfile = userData.user?.id === profileData.id;
        setIsCurrentUserProfile(isOwnProfile);

        // Check if the profile is visible
        const { data: userSettings } = await supabase
          .from("user_settings")
          .select("profile_visibility")
          .eq("user_id", profileData.id)
          .maybeSingle();

        // If profile visibility is explicitly set to false and this is not the user's own profile
        if (userSettings && userSettings.profile_visibility === false && !isOwnProfile) {
          setProfileHidden(true);
          setIsLoading(false);
          return;
        }

        // Get user's public resources
        const { data: resourcesData, error: resourcesError } = await supabase
          .from("resources")
          .select("*")
          .eq("author_id", profileData.id)
          .eq("is_approved", true)
          .order("created_at", { ascending: false });

        if (resourcesError) {
          console.error("Error fetching resources:", resourcesError);
        } else {
          console.log("Resources fetched:", resourcesData);
          setResources(resourcesData || []);
        }

        // Get user's public study groups (both created by them and ones they're a member of)
        // Step 1: Get groups created by the user
        const { data: createdGroupsData = [] } = await supabase
          .from("study_groups")
          .select("*")
          .eq("created_by", profileData.id)
          .eq("is_private", false)
          .order("created_at", { ascending: false });

        // Step 2: Get groups the user is a member of
        const { data: memberships = [] } = await supabase
          .from("study_group_members")
          .select("study_group_id")
          .eq("user_id", profileData.id);

        // Initialize combined groups with created groups
        const combinedGroups = [...createdGroupsData];

        // If user is a member of any groups, fetch and add them
        if (memberships.length > 0) {
          // Get the group IDs
          const groupIds = memberships.map(m => m.study_group_id);

          // Get the groups
          const { data: memberGroups = [] } = await supabase
            .from("study_groups")
            .select("*")
            .in("id", groupIds)
            .eq("is_private", false)
            .order("created_at", { ascending: false });

          // Add member groups, avoiding duplicates
          if (memberGroups.length > 0) {
            for (const group of memberGroups) {
              if (!combinedGroups.some(g => g.id === group.id)) {
                combinedGroups.push(group);
              }
            }
          }
        }

        setStudyGroups(combinedGroups);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      fetchData();
    }
  }, [supabase, username]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p>
            The user profile you're looking for doesn't exist or is private.
          </p>
        </div>
      </div>
    );
  }

  if (profileHidden) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Visible</h1>
          <p className="mb-4">
            This user has opted out of profile visibility.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-card rounded-lg shadow-md p-6 mb-8 relative">
        {/* Share button positioned absolutely in the top right */}
        <div className="absolute top-4 right-4 z-10">
          <ShareProfileButton
            username={profile.username}
            fullName={profile.full_name}
            bio={profile.bio}
            size="sm"
            variant="outline"
          />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="h-24 w-24 border-2 border-primary">
            <AvatarImage
              src={profile.avatar_url || ""}
              alt={profile.full_name || profile.username}
              className="object-cover"
            />
            <AvatarFallback>
              <UserCircle className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {profile.full_name}
                  {profile.is_verified && (
                    <span className="text-blue-500">
                      <CheckCircle className="h-5 w-5" />
                    </span>
                  )}
                </h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>

              <div className="flex items-center gap-2">
                {!isCurrentUserProfile && currentUser && (
                  <FollowButton
                    userId={profile.id}
                    initialIsFollowing={followStats.isFollowing}
                    onFollowStatusChange={handleFollowStatusChange}
                  />
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {profile.university_name ||
                    profile.university?.name ||
                    "University not specified"}
                </span>
              </div>
              {profile.graduation_year && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Class of {profile.graduation_year}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Joined{" "}
                  {profile.created_at
                    ? format(new Date(profile.created_at), "MMMM yyyy")
                    : "Recently"}
                </span>
              </div>
            </div>

            {profile.bio && (
              <div className="mt-4">
                <p>{profile.bio}</p>
              </div>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.interests.map((interest: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Card className="flex-1">
                <CardContent className="p-2 text-center">
                  <div className="font-medium text-base">
                    {followStats.followersCount}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                    <UsersRound className="h-3 w-3" />
                    <span>Followers</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="p-2 text-center">
                  <div className="font-medium text-base">
                    {followStats.followingCount}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                    <UserPlus className="h-3 w-3" />
                    <span>Following</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="resources" className="w-full mx-auto">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2 mx-auto">
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Resources ({resources.length})
          </TabsTrigger>
          <TabsTrigger value="study-groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Study Groups ({studyGroups.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="mt-6">
          {resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 wide:grid-cols-3 gap-8">
              {resources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onView={() => router.push(`/dashboard/resources?view=${resource.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No public resources yet
              </h3>
              <p className="text-muted-foreground">
                This user hasn't shared any public resources.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="study-groups" className="mt-6">
          {studyGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 wide:grid-cols-3 gap-8">
              {studyGroups.map((group) => {
                // Check if the current user is a member of this group
                const isMember = currentUser && group.members?.some(member => member.user_id === currentUser.id);
                return (
                  <StudyGroupCard
                    key={group.id}
                    group={group}
                    isMember={isMember}
                    onJoin={(id) => router.push(`/dashboard/study-groups?view=${id}`)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No public study groups yet
              </h3>
              <p className="text-muted-foreground">
                This user isn't a member of any public study groups.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

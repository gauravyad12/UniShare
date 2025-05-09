"use client";

export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import ResourceCard from "@/components/resource-card";
import StudyGroupCard from "@/components/study-group-card";
import ShareProfileButton from "@/components/share-profile-button";
import { useEffect, useState } from "react";
import { UserPlus, UsersRound } from "lucide-react";

export default function UserProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const router = useRouter();
  // Start with loading state true by default
  const [loading, setLoading] = useState(true);
  // Add a state to track if we're redirecting
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [studyGroups, setStudyGroups] = useState<any[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [profileHidden, setProfileHidden] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followStats, setFollowStats] = useState({
    followersCount: 0,
    followingCount: 0
  });

  // First useEffect: Check authentication status immediately
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();

        if (data.user) {
          // Store the current user ID
          setCurrentUserId(data.user.id);
          // Set redirecting state to true
          setIsRedirecting(true);
          // Redirect to dashboard profile
          router.push(`/dashboard/profile/${params.username}`);
          // Don't continue with profile data fetching
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error checking auth:", error);
        return false;
      }
    };

    checkAuth();
  }, [params.username, router]);

  // Second useEffect: Fetch profile data only if not redirecting
  useEffect(() => {
    // If we're redirecting, don't fetch profile data
    if (isRedirecting) return;

    // Set loading to true
    setLoading(true);

    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Continue with the public profile view for non-authenticated users

        // Clean the username parameter (remove @ if present and trim whitespace)
        const cleanUsername = params.username.startsWith("@")
          ? params.username.substring(1).trim()
          : params.username.trim();

        // First try exact match
        const { data: exactMatchData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("username", cleanUsername)
          .maybeSingle();

        // If not found with exact match, try case-insensitive search
        let finalProfileData = exactMatchData;

        if (!finalProfileData) {
          const { data: caseInsensitiveData } = await supabase
            .from("user_profiles")
            .select("*")
            .ilike("username", cleanUsername)
            .maybeSingle();

          finalProfileData = caseInsensitiveData;
        }

        if (!finalProfileData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Ensure we have a valid profile data object
        setProfileData(finalProfileData || {});

        // Check if the profile is visible
        const { data: userSettings } = await supabase
          .from("user_settings")
          .select("profile_visibility")
          .eq("user_id", finalProfileData.id)
          .maybeSingle();

        // If profile visibility is explicitly set to false and this is not the user's own profile
        if (userSettings && userSettings.profile_visibility === false && currentUserId !== finalProfileData.id) {
          setProfileHidden(true);
          setLoading(false);
          return;
        }

        // Fetch public resources by this user
        const { data: resourcesData = [] } = await supabase
          .from("resources")
          .select("*")
          .eq("author_id", finalProfileData.id)
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(3);

        setResources(resourcesData || []);

        // Fetch study groups the user is a member of
        try {
          // Step 1: Get groups created by the user
          const { data: createdGroupsData = [] } = await supabase
            .from("study_groups")
            .select("*")
            .eq("created_by", finalProfileData.id)
            .eq("is_private", false)
            .order("created_at", { ascending: false });

          // Step 2: Get groups the user is a member of
          const { data: memberships = [] } = await supabase
            .from("study_group_members")
            .select("study_group_id")
            .eq("user_id", finalProfileData.id);

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

            // Combine both sets of groups and remove duplicates
            const allGroups = [...createdGroupsData];

            // Add member groups, avoiding duplicates
            if (memberGroups.length > 0) {
              for (const group of memberGroups) {
                if (!allGroups.some(g => g.id === group.id)) {
                  allGroups.push(group);
                }
              }
            }

            setStudyGroups(allGroups);
          } else {
            // If user is not a member of any groups, just use created groups
            setStudyGroups(createdGroupsData);
          }
        } catch (groupsError) {
          console.error("Error fetching study groups:", groupsError);
          // If there's an error, try to at least show created groups
          try {
            const { data: createdGroupsData = [] } = await supabase
              .from("study_groups")
              .select("*")
              .eq("created_by", finalProfileData.id)
              .eq("is_private", false)
              .order("created_at", { ascending: false });

            setStudyGroups(createdGroupsData);
          } catch (fallbackError) {
            console.error("Error in fallback query:", fallbackError);
            setStudyGroups([]);
          }
        }

        // Fetch follower/following counts using the public API
        try {
          const followStatsResponse = await fetch(`/api/users/${finalProfileData.id}/follow-stats`);
          if (followStatsResponse.ok) {
            const followStatsData = await followStatsResponse.json();
            setFollowStats({
              followersCount: followStatsData.followersCount || 0,
              followingCount: followStatsData.followingCount || 0
            });
          }
        } catch (statsError) {
          console.error("Error fetching follow stats:", statsError);
          // Continue with default values if there's an error
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.username, router, isRedirecting]);

  // Always show skeleton when redirecting or loading
  if (isRedirecting || loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header Skeleton */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 align-top">
            <Skeleton className="w-24 h-24 rounded-full" />

            <div className="text-center md:text-left w-full md:w-2/3">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-4 w-full max-w-md mb-2" />
              <Skeleton className="h-4 w-full max-w-md mb-2" />
              <Skeleton className="h-4 w-full max-w-md mb-4" />

              <div className="flex gap-4 mt-4 md:justify-start justify-center">
                <Skeleton className="h-16 w-24" />
                <Skeleton className="h-16 w-24" />
              </div>
            </div>
          </div>

          {/* Tabs Skeleton */}
          <div className="w-full">
            <Skeleton className="h-10 w-full mb-6" />

            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-6">User Not Found</h1>
        <p>The profile you're looking for doesn't exist or is not public.</p>
      </div>
    );
  }

  if (profileHidden) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-6">Profile Not Visible</h1>
        <p className="mb-4">This user has opted out of public profile visibility.</p>
        <p className="text-sm text-muted-foreground">
          Sign in to connect with users and access more features.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header with Share Button in top right */}
        <div className="relative mb-8">
          {/* Share Button in top right - hidden on mobile */}
          <div className="absolute top-0 right-0 z-10 hidden md:block">
            <ShareProfileButton
              username={profileData?.username || ""}
              fullName={profileData?.full_name || ""}
              bio={profileData?.bio || ""}
              size="sm"
            />
          </div>

          {/* Profile Content */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 align-top">
            <Avatar className="w-24 h-24 border-2 border-primary">
              <AvatarImage
                src={profileData?.avatar_url || undefined}
                alt={profileData?.full_name || profileData?.username || "User"}
              />
              <AvatarFallback className="text-xl">
                {(profileData?.full_name || profileData?.username || "U")
                  .substring(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold">
                {profileData?.full_name || profileData?.username || "User"}
              </h1>
              <p className="text-muted-foreground mb-2">
                @{profileData?.username || "username"}
              </p>
              {profileData?.university_name && (
                <p className="text-sm mb-2">
                  <span className="font-medium">University:</span>{" "}
                  {profileData.university_name}
                </p>
              )}
              {profileData?.major && (
                <p className="text-sm mb-2">
                  <span className="font-medium">Major:</span> {profileData.major}
                </p>
              )}
              {profileData?.bio && (
                <p className="mt-3 text-sm">{profileData.bio}</p>
              )}
              {/* Share button for mobile view */}
              <div className="flex justify-center md:hidden mt-4">
                <ShareProfileButton
                  username={profileData?.username || ""}
                  fullName={profileData?.full_name || ""}
                  bio={profileData?.bio || ""}
                  size="sm"
                />
              </div>

              <div className="flex gap-4 mt-4 md:justify-start justify-center">
                <div className="bg-card rounded-md px-3 py-2 shadow-sm border">
                  <div className="font-bold text-base">{followStats.followingCount}</div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                    <UserPlus className="h-3 w-3" />
                    <span>Following</span>
                  </div>
                </div>
                <div className="bg-card rounded-md px-3 py-2 shadow-sm border">
                  <div className="font-bold text-base">{followStats.followersCount}</div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                    <UsersRound className="h-3 w-3" />
                    <span>Followers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for Resources and Study Groups */}
        <Tabs defaultValue="resources" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="studyGroups">Study Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="resources" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Public Resources</h2>
            {resources && resources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {resources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onView={() => router.push(`/dashboard/resources?view=${resource.id}`)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    No public resources available
                  </p>
                </CardContent>
              </Card>
            )}
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Sign in to see more resources and interact with this profile
              </p>
            </div>
          </TabsContent>

          <TabsContent value="studyGroups" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Public Study Groups</h2>
            {studyGroups && studyGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 wide:grid-cols-3 gap-8">
                {studyGroups.map((group) => (
                  <StudyGroupCard key={group.id} group={group} isPublicView={true} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    This user isn't a member of any public study groups
                  </p>
                </CardContent>
              </Card>
            )}
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Sign in to join study groups and collaborate with this user
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

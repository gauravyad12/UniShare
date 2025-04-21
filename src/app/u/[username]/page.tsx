"use client";

export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/client";
import { redirect, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResourceCard from "@/components/resource-card";
import StudyGroupCard from "@/components/study-group-card";
import { useEffect, useState } from "react";

export default function UserProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [studyGroups, setStudyGroups] = useState<any[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        // Check if user is logged in
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // If logged in, redirect to dashboard public profile
        if (session) {
          router.push(`/dashboard/public-profile/${params.username}`);
          return;
        }

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

        // Fetch public resources by this user
        const { data: resourcesData = [] } = await supabase
          .from("resources")
          .select("*")
          .eq("author_id", finalProfileData.id)
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(3);

        setResources(resourcesData || []);

        // Fetch public study groups by this user
        const { data: studyGroupsData = [] } = await supabase
          .from("study_groups")
          .select("*")
          .eq("created_by", finalProfileData.id)
          .eq("is_private", false)
          .order("created_at", { ascending: false })
          .limit(3);

        setStudyGroups(studyGroupsData);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.username, router]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-6">Loading Profile...</h1>
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 align-top">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
                {resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {studyGroups.map((group) => (
                  <StudyGroupCard key={group.id} group={group} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    No public study groups available
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

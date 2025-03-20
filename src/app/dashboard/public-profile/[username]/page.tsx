"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle, MapPin, Calendar, BookOpen, Users } from "lucide-react";
import ResourceCard from "@/components/resource-card";
import StudyGroupCard from "@/components/study-group-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FollowButton } from "@/components/follow-button";

export default function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [studyGroups, setStudyGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCurrentUserProfile, setIsCurrentUserProfile] = useState(false);
  const username = params.username;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        setCurrentUser(userData.user);

        // Get profile by username
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("username", username)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setIsLoading(false);
          return;
        }

        setProfile(profileData);
        setIsCurrentUserProfile(userData.user?.id === profileData.id);

        // Get user's public resources
        const { data: resourcesData } = await supabase
          .from("resources")
          .select("*")
          .eq("user_id", profileData.id)
          .eq("is_public", true)
          .order("created_at", { ascending: false });

        setResources(resourcesData || []);

        // Get user's public study groups
        const { data: studyGroupsData } = await supabase
          .from("study_groups")
          .select("*")
          .eq("created_by", profileData.id)
          .eq("is_public", true)
          .order("created_at", { ascending: false });

        setStudyGroups(studyGroupsData || []);
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-card rounded-lg shadow-md p-6 mb-8">
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
                <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>

              {!isCurrentUserProfile && currentUser && (
                <FollowButton userId={profile.id} />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{profile.university || "University not specified"}</span>
              </div>
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
          </div>
        </div>
      </div>

      <Tabs defaultValue="resources" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studyGroups.map((group) => (
                <StudyGroupCard key={group.id} group={group} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No public study groups yet
              </h3>
              <p className="text-muted-foreground">
                This user hasn't created any public study groups.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

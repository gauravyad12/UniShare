"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle, BookOpen, Users, Loader2, Calendar } from "lucide-react";
import { FollowButton } from "@/components/follow-button";
import { ResourceCard } from "@/components/resource-card";
import { StudyGroupCard } from "@/components/study-group-card";

export default function PublicProfilePage() {
  const searchParams = useSearchParams();
  const username = searchParams.get("username");
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [resources, setResources] = useState([]);
  const [studyGroups, setStudyGroups] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const supabase = createClient();

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Get profile by username
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("*, university:universities(name)")
          .eq("username", username)
          .single();

        if (profileError || !profileData) {
          toast({
            title: "Error",
            description: "User profile not found",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        setProfile(profileData);

        // Check if current user is following this profile
        if (user) {
          const { data: followData } = await supabase
            .from("user_followers")
            .select("*")
            .eq("follower_id", user.id)
            .eq("following_id", profileData.id)
            .single();

          setIsFollowing(!!followData);
        }

        // Get user's public resources
        const { data: resourcesData } = await supabase
          .from("resources")
          .select("*")
          .eq("user_id", profileData.id)
          .eq("visibility", "public")
          .order("created_at", { ascending: false });

        setResources(resourcesData || []);

        // Get user's public study groups
        const { data: groupsData } = await supabase
          .from("study_groups")
          .select("*")
          .eq("created_by", profileData.id)
          .eq("visibility", "public")
          .order("created_at", { ascending: false });

        setStudyGroups(groupsData || []);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              The user profile you're looking for doesn't exist or is not
              available.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex-shrink-0">
            <Avatar className="h-24 w-24 border-4 border-background">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              ) : (
                <AvatarFallback className="text-4xl">
                  <UserCircle className="h-12 w-12" />
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          <div className="flex-grow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                <CardDescription className="text-lg">
                  @{profile.username}
                </CardDescription>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  {profile.university?.name && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {profile.graduation_year
                        ? `Class of ${profile.graduation_year}`
                        : "Student"}
                    </span>
                  )}
                </div>
              </div>
              {currentUser && currentUser.id !== profile.id && (
                <FollowButton userId={profile.id} isFollowing={isFollowing} />
              )}
            </div>
            {profile.bio && <p className="mt-4 text-sm">{profile.bio}</p>}
            <div className="flex gap-4 mt-4">
              <div className="text-sm">
                <span className="font-bold">0</span> Following
              </div>
              <div className="text-sm">
                <span className="font-bold">0</span> Followers
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="resources" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Study Groups
          </TabsTrigger>
        </TabsList>
        <TabsContent value="resources">
          {resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Resources</CardTitle>
                <CardDescription>
                  This user hasn't shared any public resources yet.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="groups">
          {studyGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studyGroups.map((group) => (
                <StudyGroupCard key={group.id} group={group} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Study Groups</CardTitle>
                <CardDescription>
                  This user hasn't created any public study groups yet.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

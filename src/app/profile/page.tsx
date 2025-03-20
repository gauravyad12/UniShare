"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserCircle, BookOpen, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { FollowButton } from "@/components/follow-button";

export default function UserProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const usernameParam = searchParams.get("username");

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [studyGroups, setStudyGroups] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!usernameParam) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // Clean the username parameter (remove @ if present)
        const username = usernameParam.startsWith("@")
          ? usernameParam.substring(1)
          : usernameParam;

        // Get current user if logged in
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Get user by username
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select(
            "*, university:universities(name), followers:user_followers!user_followers_user_id_fkey(count), following:user_followers!user_followers_follower_id_fkey(count)",
          )
          .ilike("username", username)
          .maybeSingle();

        if (profileError || !profileData) {
          setError(true);
          setLoading(false);
          return;
        }

        setProfile(profileData);
        setFollowerCount(profileData.followers?.[0]?.count || 0);
        setFollowingCount(profileData.following?.[0]?.count || 0);

        // Check if current user is following this user
        if (user) {
          const { data: followData } = await supabase
            .from("user_followers")
            .select("*")
            .eq("user_id", profileData.id)
            .eq("follower_id", user.id)
            .single();

          setIsFollowing(!!followData);
        }

        // Get user's resources
        const { data: resourcesData } = await supabase
          .from("resources")
          .select("*")
          .eq("author_id", profileData.id)
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(3);

        setResources(resourcesData || []);

        // Get user's study groups
        const { data: studyGroupMembers } = await supabase
          .from("study_group_members")
          .select("study_group_id")
          .eq("user_id", profileData.id);

        const studyGroupIds =
          studyGroupMembers?.map((m) => m.study_group_id) || [];

        if (studyGroupIds.length > 0) {
          const { data: groups } = await supabase
            .from("study_groups")
            .select("*")
            .in("id", studyGroupIds)
            .limit(3);
          setStudyGroups(groups || []);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [usernameParam]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
          <UserCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The user profile you're looking for doesn't exist or is unavailable.
          </p>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || profile.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-24 h-24 text-primary" />
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold">
                  {profile.full_name || profile.username}
                </h1>
                <p className="text-muted-foreground">@{profile.username}</p>
                <p className="mt-2">
                  {profile.university?.name || "University Student"}
                </p>
                {profile.bio && <p className="mt-4">{profile.bio}</p>}

                <div className="flex gap-4 mt-4 justify-center md:justify-start">
                  <div>
                    <span className="font-bold">{followerCount}</span>{" "}
                    <span className="text-muted-foreground">Followers</span>
                  </div>
                  <div>
                    <span className="font-bold">{followingCount}</span>{" "}
                    <span className="text-muted-foreground">Following</span>
                  </div>
                </div>

                {currentUser && currentUser.id !== profile.id && (
                  <div className="mt-4">
                    <FollowButton
                      userId={profile.id}
                      isFollowing={isFollowing}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Resources
              </CardTitle>
              <CardDescription>
                Resources shared by {profile.full_name || profile.username}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resources.length > 0 ? (
                <div className="space-y-4">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <h3 className="font-medium">{resource.title}</h3>
                      {resource.course_code && (
                        <p className="text-sm text-muted-foreground">
                          {resource.course_code}
                        </p>
                      )}
                      <p className="text-sm mt-2 line-clamp-2">
                        {resource.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="font-medium">No resources shared yet</h3>
                </div>
              )}
            </CardContent>
            {resources.length > 0 && (
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/resources">View All Resources</Link>
                </Button>
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Study Groups
              </CardTitle>
              <CardDescription>
                Groups that {profile.full_name || profile.username} is part of
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studyGroups.length > 0 ? (
                <div className="space-y-4">
                  {studyGroups.map((group) => (
                    <div
                      key={group.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <h3 className="font-medium">{group.name}</h3>
                      {group.course_code && (
                        <p className="text-sm text-muted-foreground">
                          {group.course_code}
                        </p>
                      )}
                      <p className="text-sm mt-2 line-clamp-2">
                        {group.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="font-medium">No study groups joined yet</h3>
                </div>
              )}
            </CardContent>
            {studyGroups.length > 0 && (
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/study-groups">
                    View All Study Groups
                  </Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

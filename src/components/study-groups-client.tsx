"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Calendar, Plus, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import StudyGroupCard from "@/components/study-group-card";

export default function StudyGroupsClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/study-groups/list');
        const result = await response.json();
        setData(result);
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

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Study Groups</h1>
          <Button onClick={() => router.push('/dashboard/study-groups/create')}>
            <Users className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search study groups by name, course code, or description..."
            className="pl-10"
          />
        </div>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Groups</TabsTrigger>
          <TabsTrigger value="my-groups">My Groups</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Meetings</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {studyGroups && studyGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studyGroups.map((group: any) => (
                <div key={group.id} className="cursor-pointer" onClick={() => {
                  router.push(`/dashboard/study-groups/${group.id}`);
                }}>
                  <StudyGroupCard
                    group={group}
                    isMember={userGroupIds.includes(group.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/40">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
                <Users className="h-12 w-12 text-muted-foreground" />
                <CardTitle>No study groups found</CardTitle>
                <CardDescription>
                  Be the first to create a study group for your university!
                </CardDescription>
                <Button className="mt-2" onClick={() => router.push('/dashboard/study-groups/create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Study Group
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-groups" className="space-y-4">
          {myStudyGroups && myStudyGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myStudyGroups.map((group: any) => (
                <div key={group.id} className="cursor-pointer" onClick={() => {
                  router.push(`/dashboard/study-groups/${group.id}`);
                }}>
                  <StudyGroupCard
                    key={group.id}
                    group={group}
                    isMember={true}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/40">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
                <Users className="h-12 w-12 text-muted-foreground" />
                <CardTitle>No Study Groups Yet</CardTitle>
                <CardDescription>
                  You haven't joined any study groups yet.
                </CardDescription>
                <Button className="mt-2" onClick={() => router.push('/dashboard/study-groups?tab=all')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Join a Group
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

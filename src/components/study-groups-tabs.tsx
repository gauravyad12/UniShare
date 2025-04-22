"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import MobileTabs from "@/components/mobile-tabs";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, LinkIcon } from "lucide-react";
import StudyGroupCard from "@/components/study-group-card";
import UserMeetingsCarousel from "@/components/user-meetings-carousel";
import { useRouter } from "next/navigation";

interface StudyGroupsTabsProps {
  initialTab: string;
  allGroups: any[];
  myGroups: any[];
  userGroupIds: string[];
  onSearch: (query: string) => void;
}

export default function StudyGroupsTabs({
  initialTab,
  allGroups,
  myGroups,
  userGroupIds,
  onSearch
}: StudyGroupsTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.pushState(null, "", url.toString());
  };

  // Handle search input change
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  return (
    <Tabs value={activeTab} className="w-full">
      <MobileTabs 
        tabs={[
          { value: "all", label: "All Groups" },
          { value: "my-groups", label: "My Groups" },
          { value: "upcoming", label: "Meetings" },
        ]}
        activeTab={activeTab}
        className="mb-6"
        onTabChange={handleTabChange}
      />

      <TabsContent value="all" className="space-y-4 overflow-x-hidden">
        {allGroups && allGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {allGroups.map((group: any) => (
              <div key={group.id}>
                <StudyGroupCard
                  group={group}
                  isMember={userGroupIds.includes(group.id)}
                  onView={(id) => router.push(`/dashboard/study-groups?view=${id}`)}
                  onJoin={(id) => router.push(`/dashboard/study-groups?view=${id}`)}
                />
              </div>
            ))}
          </div>
        ) : allGroups && allGroups.length === 0 && searchQuery.trim() !== '' ? (
          <Card className="bg-muted/40">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
              <Users className="h-12 w-12 text-muted-foreground" />
              <CardTitle>No study groups match your search</CardTitle>
              <CardDescription>Try a different search term or create a new group</CardDescription>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setSearchQuery('');
                  onSearch('');
                }}
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

      <TabsContent value="my-groups" className="space-y-4 overflow-x-hidden">
        {myGroups && myGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {myGroups.map((group: any) => (
              <div key={group.id}>
                <StudyGroupCard
                  key={group.id}
                  group={group}
                  isMember={true}
                  onView={(id) => router.push(`/dashboard/study-groups?view=${id}`)}
                />
              </div>
            ))}
          </div>
        ) : myGroups && myGroups.length === 0 && searchQuery.trim() !== '' ? (
          <Card className="bg-muted/40">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
              <Users className="h-12 w-12 text-muted-foreground" />
              <CardTitle>No study groups match your search</CardTitle>
              <CardDescription>Try a different search term or join a new group</CardDescription>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setSearchQuery('');
                  onSearch('');
                }}
              >
                Clear Search
              </Button>
              <Button className="mt-2" onClick={() => router.push('/dashboard/study-groups?join=true')}>
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
              <Button className="mt-2" onClick={() => router.push('/dashboard/study-groups?join=true')}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Join with Code
              </Button>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="upcoming" className="space-y-4 overflow-x-hidden">
        <UserMeetingsCarousel />
      </TabsContent>
    </Tabs>
  );
}

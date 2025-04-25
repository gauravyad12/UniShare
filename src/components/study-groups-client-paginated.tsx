"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import StudyGroupsTabs from "@/components/study-groups-tabs";
import { Calendar, Plus, Users, Loader2, Link as LinkIcon } from "lucide-react";
import StyledSearchBarWrapper from "./styled-search-bar-wrapper";
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
import UserMeetingsCarousel from "@/components/user-meetings-carousel";
import PaginationControlWrapper from "@/components/pagination-control-wrapper";

export default function StudyGroupsClientPaginated({
  tab = "all",
  initialPage = 1
}: {
  tab?: string;
  initialPage?: number;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [filteredGroups, setFilteredGroups] = useState<any[]>([]);
  const [filteredMyGroups, setFilteredMyGroups] = useState<any[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalMyGroups, setTotalMyGroups] = useState(0);
  const pageSize = 2; // Set to 2 for testing pagination

  // Initialize state from URL parameters on mount
  useEffect(() => {
    // Get page from URL
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const parsedPage = parseInt(pageParam, 10);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        setCurrentPage(parsedPage);
      }
    }

    // Get search from URL
    const searchParam = searchParams.get('search');
    if (searchParam !== null) {
      setSearchQuery(searchParam);
    }
  }, []); // Empty dependency array means this runs only once on mount

  // Data fetching effect
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Get the Supabase client for direct queries if needed
        const supabase = createClient();

        // Calculate offset for pagination
        const offset = (currentPage - 1) * pageSize;

        // Fetch public study groups with pagination
        const publicResponse = await fetch(`/api/study-groups/list?limit=${pageSize}&offset=${offset}&search=${encodeURIComponent(searchQuery)}`);
        if (!publicResponse.ok) {
          throw new Error(`Failed to fetch study groups: ${publicResponse.status}`);
        }
        const publicResult = await publicResponse.json();

        // Get total count for pagination
        setTotalGroups(publicResult.totalCount || 0);

        // Fetch user's study groups (including private ones) with pagination
        let myGroups = [];
        let myGroupsTotal = 0;
        try {
          const myGroupsResponse = await fetch(`/api/study-groups/my-groups?limit=${pageSize}&offset=${offset}&search=${encodeURIComponent(searchQuery)}`);
          if (!myGroupsResponse.ok) {
            throw new Error(`Failed to fetch my study groups: ${myGroupsResponse.status}`);
          }
          const myGroupsResult = await myGroupsResponse.json();
          myGroups = myGroupsResult.myGroups || [];
          myGroupsTotal = myGroupsResult.totalCount || 0;
          setTotalMyGroups(myGroupsTotal);
        } catch (err) {
          console.error('Error fetching from my-groups API:', err);

          // Fallback to direct query if API fails
          try {
            // Get the current user
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
              // Get all study group IDs the user is a member of
              const { data: memberGroups } = await supabase
                .from("study_group_members")
                .select("study_group_id")
                .eq("user_id", user.id);

              const memberGroupIds = memberGroups?.map((g: { study_group_id: string }) => g.study_group_id) || [];

              // Get total count first
              if (memberGroupIds.length > 0) {
                const { count } = await supabase
                  .from("study_groups")
                  .select("*", { count: "exact", head: true })
                  .in("id", memberGroupIds);

                setTotalMyGroups(count || 0);

                // Then fetch paginated results
                const { data: directGroups } = await supabase
                  .from("study_groups")
                  .select("*")
                  .in("id", memberGroupIds)
                  .order("created_at", { ascending: false })
                  .range(offset, offset + pageSize - 1);

                if (directGroups && directGroups.length > 0) {
                  myGroups = directGroups;
                }
              }
            }
          } catch (err) {
            console.error('Fallback query failed:', err);
          }
        }

        // Combine the results
        const result = {
          studyGroups: publicResult.studyGroups || [],
          userGroupIds: publicResult.userGroupIds || [],
          myStudyGroups: myGroups
        };

        setData(result);

        // Initialize filtered groups
        setFilteredGroups(result.studyGroups || []);
        setFilteredMyGroups(result.myStudyGroups || []);
      } catch (error) {
        console.error('Error fetching study groups:', error);
        toast({
          title: "Error",
          description: "Failed to load study groups. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentPage, searchQuery, toast]);

  // Make sure userGroupIds includes all IDs from myStudyGroups
  const { userGroupIds = [], myStudyGroups = [] } = data || {};
  const myGroupIds = myStudyGroups.map((group: any) => group.id);
  // Combine and deduplicate IDs
  const allUserGroupIds = Array.from(new Set([...userGroupIds, ...myGroupIds]));

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

  // Simple function to handle page changes
  const handlePageChange = (page: number) => {
    if (page === currentPage) return;

    // Update the URL with the new page
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.replace(`/dashboard/study-groups?${params.toString()}`, { scroll: false });

    // Update the state
    setCurrentPage(page);
  };

  // Simple function to handle search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);

    // Update URL with search parameter and reset to page 1
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", query);
    params.set("page", "1"); // Always reset to page 1 when search changes
    router.replace(`/dashboard/study-groups?${params.toString()}`, { scroll: false });

    // Update the state
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  if (loading && !data) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="h-10 w-48 bg-muted rounded"></div>
            <div className="h-10 w-32 bg-muted rounded"></div>
          </div>
          <div className="h-10 w-full bg-muted rounded"></div>
        </div>

        <div className="h-10 w-64 bg-muted rounded-md mb-6"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-48 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-8 overflow-x-hidden">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2">
          <h1 className="text-3xl font-bold">Study Groups</h1>
          <div className="flex flex-wrap w-full sm:w-auto gap-2">
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-auto">
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
                  <div className="grid sm:grid-cols-4 items-center gap-4">
                    <label htmlFor="inviteCode" className="sm:text-right">
                      Invitation Code
                    </label>
                    <Input
                      id="inviteCode"
                      placeholder="Enter code"
                      className="sm:col-span-3"
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
            <Button onClick={() => router.push('/dashboard/study-groups/create')} className="flex-1 sm:flex-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </div>
        </div>
        <div className="w-full">
          <StyledSearchBarWrapper
            placeholder="Search by name, course code..."
            defaultValue={searchQuery}
            baseUrl="/dashboard/study-groups"
            tabParam={tab}
          />
        </div>
      </header>

      {/* Study Groups Tabs */}
      <StudyGroupsTabs
        initialTab={tab}
        allGroups={filteredGroups}
        myGroups={filteredMyGroups}
        userGroupIds={allUserGroupIds}
        onSearch={handleSearchChange}
      />

      {/* Pagination */}
      <div className="mt-6">
        <PaginationControlWrapper
          totalItems={tab === "my-groups" ? totalMyGroups : totalGroups}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Loading overlay for subsequent page loads */}
      {loading && data && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="bg-card p-4 rounded-lg shadow-lg flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p>Loading study groups...</p>
          </div>
        </div>
      )}
    </div>
  );
}

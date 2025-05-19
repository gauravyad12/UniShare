export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SimpleStudyGroupView from "@/components/simple-study-group-view";
import SimpleGroupChat from "@/components/simple-group-chat";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import StyledSearchBarWrapper from "@/components/styled-search-bar-wrapper";
import Link from "next/link";
import StudyGroupsTabs from "@/components/study-groups-tabs";
import PaginationControlWrapper from "@/components/pagination-control-wrapper";
import ResponsiveJoinButton from "@/components/responsive-join-button";
import StudyGroupsDynamicTitle from "@/components/study-groups-dynamic-title";

export default async function StudyGroupsPage({
  searchParams,
}: {
  searchParams: {
    view?: string;
    tab?: string;
    search?: string;
    chat?: string;
    page?: string;
  };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user's university
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("university_id")
    .eq("id", user.id)
    .single();

  // If viewing a specific study group
  let viewedGroup = null;
  if (searchParams.view) {
    // Use the stored procedure to avoid RLS recursion issues
    const { data, error } = await supabase
      .rpc('get_study_group_by_id', {
        p_group_id: searchParams.view
      });

    if (data && data.length > 0) {
      viewedGroup = data[0];
    }
  }

  // If viewing a specific group, render the group view
  if (viewedGroup) {
    const chatMode = !!searchParams.chat;

    return (
      <div className="study-group-view-container px-2 sm:px-4 md:px-6">
        {/* Dynamic page title for viewed group */}
        <StudyGroupsDynamicTitle viewedGroup={viewedGroup} chatMode={chatMode} />

        {chatMode ? (
          <SimpleGroupChat group={viewedGroup} />
        ) : (
          <SimpleStudyGroupView group={viewedGroup} />
        )}
      </div>
    );
  }

  // Determine which tab to show
  const activeTab = searchParams.tab || "all";

  // Pagination parameters
  const pageSize = 9; // Number of items per page
  const currentPage = parseInt(searchParams.page || "1", 10);
  const offset = (currentPage - 1) * pageSize;
  const searchTerm = searchParams.search || "";

  // Get public study groups
  let publicGroupsQuery = supabase
    .from("study_groups")
    .select("*")
    .eq("university_id", userProfile?.university_id)
    .eq("is_private", false);

  // Apply search filter if provided
  if (searchTerm) {
    publicGroupsQuery = publicGroupsQuery.or(
      `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,course_code.ilike.%${searchTerm}%`
    );
  }

  // Order by created_at
  publicGroupsQuery = publicGroupsQuery.order("created_at", { ascending: false });

  // Get total count for pagination
  let countQuery = supabase
    .from("study_groups")
    .select("*", { count: "exact", head: true })
    .eq("university_id", userProfile?.university_id)
    .eq("is_private", false);

  // Apply the same search filter to count query
  if (searchTerm) {
    countQuery = countQuery.or(
      `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,course_code.ilike.%${searchTerm}%`
    );
  }

  const { count: totalPublicCount } = await countQuery;

  // Apply pagination to the main query
  publicGroupsQuery = publicGroupsQuery.range(offset, offset + pageSize - 1);

  // Execute the query
  const { data: publicGroups } = await publicGroupsQuery;

  // Get user's study groups (including private ones)
  // First get all groups the user is a member of
  const { data: memberGroups } = await supabase
    .from("study_group_members")
    .select("study_group_id")
    .eq("user_id", user.id);

  const memberGroupIds = memberGroups?.map(g => g.study_group_id) || [];

  let myGroups = [];
  let totalMyGroupsCount = 0;

  if (memberGroupIds.length > 0) {
    // Get total count for my groups
    let myGroupsCountQuery = supabase
      .from("study_groups")
      .select("*", { count: "exact", head: true })
      .in("id", memberGroupIds);

    // Apply search filter if provided
    if (searchTerm) {
      myGroupsCountQuery = myGroupsCountQuery.or(
        `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,course_code.ilike.%${searchTerm}%`
      );
    }

    const { count: myCount } = await myGroupsCountQuery;
    totalMyGroupsCount = myCount || 0;

    // Get paginated my groups
    let myGroupsQuery = supabase
      .from("study_groups")
      .select("*")
      .in("id", memberGroupIds)
      .order("created_at", { ascending: false });

    // Apply search filter if provided
    if (searchTerm) {
      myGroupsQuery = myGroupsQuery.or(
        `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,course_code.ilike.%${searchTerm}%`
      );
    }

    // Apply pagination
    myGroupsQuery = myGroupsQuery.range(offset, offset + pageSize - 1);

    // Execute the query
    const { data: myGroupsData } = await myGroupsQuery;
    myGroups = myGroupsData || [];
  }

  // Get user's group IDs for highlighting
  const userGroupIds = memberGroupIds || [];

  // Determine total count based on active tab
  const totalCount = activeTab === "my-groups" ? totalMyGroupsCount : totalPublicCount;

  return (
    <div className="container mx-auto px-4 py-8 pb-15 md:pb-8 flex flex-col gap-8">
      {/* Dynamic page title for study groups list */}
      <StudyGroupsDynamicTitle activeTab={activeTab} />

      <header className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2">
          <h1 className="text-3xl font-bold">Study Groups</h1>
          <div className="flex flex-wrap w-full sm:w-auto gap-2">
            <ResponsiveJoinButton />
            <Button asChild>
              <Link href="/dashboard/study-groups/create">
                <Plus className="mr-2 h-4 w-4" /> Create Group
              </Link>
            </Button>
          </div>
        </div>
        <div className="w-full">
          <StyledSearchBarWrapper
            placeholder="Search by name, course code..."
            defaultValue={searchParams.search || ""}
            baseUrl="/dashboard/study-groups"
            tabParam={searchParams.tab}
          />
        </div>
      </header>

      {/* Study Groups Tabs */}
      <StudyGroupsTabs
        initialTab={activeTab}
        allGroups={publicGroups || []}
        myGroups={myGroups}
        userGroupIds={userGroupIds}
      />

      {/* Pagination */}
      <div className="mt-4 md:mt-6">
        <PaginationControlWrapper
          totalItems={totalCount || 0}
          pageSize={pageSize}
          currentPage={currentPage}
          baseUrl="/dashboard/study-groups"
          preserveParams={true}
        />
      </div>
    </div>
  );
}

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import StudyGroupsClientPaginated from "@/components/study-groups-client-paginated";
import SimpleStudyGroupView from "@/components/simple-study-group-view";
import SimpleGroupChat from "@/components/simple-group-chat";

export const dynamic = "force-dynamic";


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

  // If viewing a specific study group
  let viewedGroup = null;
  if (searchParams.view) {
    console.log('Fetching study group with ID:', searchParams.view);

    // Use the stored procedure to avoid RLS recursion issues
    const { data, error } = await supabase
      .rpc('get_study_group_by_id', {
        p_group_id: searchParams.view
      });

    if (error) {
      console.error('Error fetching study group:', error);
    }

    if (data && data.length > 0) {
      console.log('Found study group:', data[0]);
      viewedGroup = data[0];
    } else {
      console.log('Study group not found');
    }
  }

  return (
    <div className="study-groups-container px-2 sm:px-4 md:px-6">
      {viewedGroup ? (
        <div className="study-group-view-container px-2 sm:px-4 md:px-6">
          {searchParams.chat ? (
            <SimpleGroupChat group={viewedGroup} />
          ) : (
            <SimpleStudyGroupView group={viewedGroup} />
          )}
        </div>
      ) : (
        <StudyGroupsClientPaginated
          tab={searchParams.tab || "all"}
          initialPage={searchParams.page ? parseInt(searchParams.page) : 1}
        />
      )}
    </div>
  );
}

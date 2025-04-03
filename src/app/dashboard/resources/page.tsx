import { createClient } from "@/utils/supabase/server";
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
import { Search, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { redirect } from "next/navigation";
import ResourceUploadForm from "@/components/resource-upload-form";
import ResourceViewWrapper from "@/components/resource-view-wrapper";
import ResourceTabContent from "@/components/resource-tab-content";
import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UniShare | Resources",
  description: "Browse and share academic resources with your university peers",
};

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: {
    upload?: string;
    view?: string;
    tab?: string;
    search?: string;
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

  // Determine which tab to show
  const activeTab = searchParams.tab || "all";

  // Get resources based on the active tab
  let resourcesQuery = supabase
    .from("resources")
    .select("*")
    .eq("university_id", userProfile?.university_id)
    .eq("is_approved", true);

  // Apply search filter if provided
  if (searchParams.search) {
    const searchTerm = searchParams.search.toLowerCase();
    resourcesQuery = resourcesQuery.or(
      `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,course_code.ilike.%${searchTerm}%,professor.ilike.%${searchTerm}%`,
    );
  }

  // Filter by resource type if needed
  if (activeTab === "notes") {
    resourcesQuery = resourcesQuery.eq("resource_type", "notes");
  } else if (activeTab === "textbooks") {
    resourcesQuery = resourcesQuery.eq("resource_type", "textbook");
  } else if (activeTab === "links") {
    resourcesQuery = resourcesQuery.eq("resource_type", "link");
  } else if (activeTab === "my-uploads") {
    resourcesQuery = resourcesQuery.eq("author_id", user.id);
  }

  // Order by created_at
  resourcesQuery = resourcesQuery.order("created_at", { ascending: false });

  // Execute the query
  const { data: resources } = await resourcesQuery.limit(20);

  // If viewing a specific resource
  let viewedResource = null;
  if (searchParams.view) {
    const { data: resource } = await supabase
      .from("resources")
      .select("*")
      .eq("id", searchParams.view)
      .single();

    if (resource) {
      viewedResource = resource;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Resources</h1>
          <Button asChild>
            <Link href="/dashboard/resources?upload=true">
              <Upload className="mr-2 h-4 w-4" />
              Upload Resource
            </Link>
          </Button>
        </div>
        <form action="/dashboard/resources" method="get" className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Search resources by title, course code, or professor..."
            className="pl-10"
            defaultValue={searchParams.search || ""}
          />
          {/* Preserve other query parameters */}
          {searchParams.tab && (
            <input type="hidden" name="tab" value={searchParams.tab} />
          )}
        </form>
      </header>

      {/* Upload Form Dialog */}
      {searchParams.upload && (
        <Card>
          <CardHeader>
            <CardTitle>Upload New Resource</CardTitle>
            <CardDescription>
              Share study materials with your university peers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResourceUploadForm />
          </CardContent>
        </Card>
      )}

      {/* View Resource */}
      {viewedResource && (
        <ResourceViewWrapper
          resource={viewedResource}
          isOwner={viewedResource.author_id === user.id}
        />
      )}

      {/* Resources List */}
      {!searchParams.upload && !viewedResource && (
        <Tabs defaultValue={activeTab} className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="mb-4 w-max min-w-full">
              <TabsTrigger value="all" asChild>
                <Link href="/dashboard/resources?tab=all">All Resources</Link>
              </TabsTrigger>
              <TabsTrigger value="notes" asChild>
                <Link href="/dashboard/resources?tab=notes">Notes</Link>
              </TabsTrigger>
              <TabsTrigger value="textbooks" asChild>
                <Link href="/dashboard/resources?tab=textbooks">Textbooks</Link>
              </TabsTrigger>
              <TabsTrigger value="links" asChild>
                <Link href="/dashboard/resources?tab=links">
                  External Links
                </Link>
              </TabsTrigger>
              <TabsTrigger value="my-uploads" asChild>
                <Link href="/dashboard/resources?tab=my-uploads">
                  My Uploads
                </Link>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value={activeTab}
            className="space-y-4 min-h-[300px] relative"
          >
            <ResourceTabContent
              resources={resources || []}
              activeTab={activeTab}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

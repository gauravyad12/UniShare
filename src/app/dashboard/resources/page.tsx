export const dynamic = "force-dynamic";

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
import { Upload, BookOpen } from "lucide-react";
import StyledSearchBarWrapper from "@/components/styled-search-bar-wrapper";
import ResourcesTabs from "@/components/resources-tabs";
import PaginationControlWrapper from "@/components/pagination-control-wrapper";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { redirect } from "next/navigation";
import ResourceUploadForm from "@/components/resource-upload-form";
import ResourceViewWrapper from "@/components/resource-view-wrapper";
import ResourceTabContent from "@/components/resource-tab-content";
import { Suspense } from "react";
import { Metadata } from "next";
import ResourcesDynamicTitle from "@/components/resources-dynamic-title";

// Metadata is now handled in metadata.ts

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: {
    upload?: string;
    view?: string;
    tab?: string;
    search?: string;
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

  // Determine which tab to show
  const activeTab = searchParams.tab || "all";

  // Pagination parameters
  const pageSize = 6; // Number of items per page
  const currentPage = parseInt(searchParams.page || "1", 10);
  const offset = (currentPage - 1) * pageSize;

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
  } else if (activeTab === "solutions") {
    resourcesQuery = resourcesQuery.eq("resource_type", "solution");
  } else if (activeTab === "study-guides") {
    resourcesQuery = resourcesQuery.eq("resource_type", "study guide");
  } else if (activeTab === "practice-exams") {
    resourcesQuery = resourcesQuery.eq("resource_type", "practice exam");
  } else if (activeTab === "links") {
    resourcesQuery = resourcesQuery.eq("resource_type", "link");
  } else if (activeTab === "my-uploads") {
    resourcesQuery = resourcesQuery.eq("author_id", user.id);
  }

  // Order by created_at
  resourcesQuery = resourcesQuery.order("created_at", { ascending: false });

  // Get total count for pagination
  const countQuery = supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("university_id", userProfile?.university_id)
    .eq("is_approved", true);

  // Apply the same filters as the main query
  if (searchParams.search) {
    const searchTerm = searchParams.search.toLowerCase();
    countQuery.or(
      `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,course_code.ilike.%${searchTerm}%,professor.ilike.%${searchTerm}%`,
    );
  }

  if (activeTab === "notes") {
    countQuery.eq("resource_type", "notes");
  } else if (activeTab === "textbooks") {
    countQuery.eq("resource_type", "textbook");
  } else if (activeTab === "solutions") {
    countQuery.eq("resource_type", "solution");
  } else if (activeTab === "study-guides") {
    countQuery.eq("resource_type", "study guide");
  } else if (activeTab === "practice-exams") {
    countQuery.eq("resource_type", "practice exam");
  } else if (activeTab === "links") {
    countQuery.eq("resource_type", "link");
  } else if (activeTab === "my-uploads") {
    countQuery.eq("author_id", user.id);
  }

  const { count: totalCount } = await countQuery;

  // Apply pagination to the main query
  resourcesQuery = resourcesQuery.range(offset, offset + pageSize - 1);

  // Execute the query
  const { data: resources } = await resourcesQuery;

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
    <div className="container mx-auto px-4 py-8 pb-15 md:pb-8 flex flex-col gap-8">
      {/* Dynamic page title */}
      <ResourcesDynamicTitle viewedResource={viewedResource} activeTab={activeTab} />

      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          {searchParams.view ? (
            <div className="relative group">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold group-hover:text-primary transition-colors md:group-hover:text-inherit">Resources</h1>
              </div>
              <Link
                href={`/dashboard/resources${searchParams.tab ? `?tab=${searchParams.tab}` : ''}`}
                className="md:hidden absolute inset-0"
                aria-label="Back to resources"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Resources</h1>
            </div>
          )}
          <Button asChild className="hidden md:flex">
            <Link href="/dashboard/resources?upload=true">
              <Upload className="mr-2 h-4 w-4" />
              Upload Resource
            </Link>
          </Button>
        </div>
        <div className="w-full">
          <StyledSearchBarWrapper
            placeholder="Search by title, course code..."
            defaultValue={searchParams.search || ""}
            baseUrl="/dashboard/resources"
            tabParam={searchParams.tab}
          />
        </div>
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
        <>
          <ResourcesTabs
            resources={resources || []}
            initialTab={activeTab}
            currentUserId={user.id}
          />

          {/* Pagination */}
          <div className="mt-4 md:mt-8">
            <PaginationControlWrapper
              totalItems={totalCount || 0}
              pageSize={pageSize}
              currentPage={currentPage}
              baseUrl="/dashboard/resources"
              preserveParams={true}
            />
          </div>
        </>
      )}
    </div>
  );
}

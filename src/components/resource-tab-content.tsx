"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import LoadingSpinner from "./loading-spinner";
import ResourceCard from "./resource-card";
import ResourceSkeleton from "./resource-skeleton";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { BookOpen, FileText, Link as LinkIcon, Plus } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  course_code?: string;
  file_url?: string;
  external_link?: string;
  author_id: string;
  created_at: string;
  view_count: number;
  download_count: number;
  comment_count?: number;
}

interface ResourceTabContentProps {
  resources: Resource[];
  activeTab: string;
}

export default function ResourceTabContent({
  resources,
  activeTab,
}: ResourceTabContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reset loading state when tab or resources change
  useEffect(() => {
    // Show loading state briefly when tab or resources change
    setIsLoading(true);

    // Use a shorter timeout for a snappier experience
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [activeTab, resources]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <ResourceSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <Card className="bg-muted/40">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
          {activeTab === "notes" ? (
            <FileText className="h-12 w-12 text-muted-foreground" />
          ) : activeTab === "links" ? (
            <LinkIcon className="h-12 w-12 text-muted-foreground" />
          ) : (
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          )}
          <CardTitle>
            {activeTab === "my-uploads"
              ? "You haven't uploaded any resources yet"
              : "No resources found"}
          </CardTitle>
          <CardDescription>
            {activeTab === "my-uploads"
              ? "Share your knowledge with your university peers"
              : "Be the first to upload resources for your university!"}
          </CardDescription>
          <Button className="mt-2" asChild>
            <Link href="/dashboard/resources?upload=true">
              <Plus className="mr-2 h-4 w-4" />
              Upload Resource
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          onView={() => router.push(`/dashboard/resources?view=${resource.id}&tab=${activeTab}`)}
        />
      ))}
    </div>
  );
}

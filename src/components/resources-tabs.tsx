"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import MobileTabs from "@/components/mobile-tabs";
import ResourceTabContent from "@/components/resource-tab-content";

interface ResourcesTabsProps {
  resources: any[];
  initialTab: string;
  currentUserId: string;
}

// Component that safely reads search params
function SearchParamsReader({ onParamsChange }: { onParamsChange: (params: URLSearchParams) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams) {
      onParamsChange(searchParams);
    }
  }, [searchParams, onParamsChange]);

  return null;
}

export default function ResourcesTabs({ resources, initialTab, currentUserId }: ResourcesTabsProps) {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [filteredResources, setFilteredResources] = useState(resources);

  // Callback to handle search params changes
  const handleParamsChange = useCallback((params: URLSearchParams) => {
    setSearchParams(params);
  }, []);

  // Filter resources based on active tab
  useEffect(() => {
    let filtered = [...resources];

    if (activeTab === "notes") {
      filtered = resources.filter(resource => resource.resource_type === "notes");
    } else if (activeTab === "textbooks") {
      filtered = resources.filter(resource => resource.resource_type === "textbook");
    } else if (activeTab === "links") {
      filtered = resources.filter(resource => resource.resource_type === "link");
    } else if (activeTab === "my-uploads") {
      filtered = resources.filter(resource => resource.author_id === currentUserId);
    }

    setFilteredResources(filtered);
  }, [activeTab, resources, currentUserId]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    // Only proceed if the tab is actually changing
    if (value === activeTab) return;

    setActiveTab(value);

    // Use server-side navigation to fetch the correct resources for the new tab
    if (searchParams) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);

      // Reset to page 1 when changing tabs
      params.set("page", "1");

      // Use router.push for server-side navigation
      router.push(`/dashboard/resources?${params.toString()}`);
    }
  };

  return (
    <>
      {/* Safely read search params with Suspense */}
      <Suspense fallback={null}>
        <SearchParamsReader onParamsChange={handleParamsChange} />
      </Suspense>

      <Tabs value={activeTab} className="w-full">
        <MobileTabs
          tabs={[
            { value: "all", label: "All Resources" },
            { value: "notes", label: "Notes" },
            { value: "textbooks", label: "Textbooks" },
            { value: "links", label: "External Links" },
            { value: "my-uploads", label: "My Uploads" },
          ]}
          activeTab={activeTab}
          className="mb-6"
          onTabChange={handleTabChange}
        />

      <TabsContent
        value={activeTab}
        className="space-y-4 min-h-[300px] relative"
      >
        <ResourceTabContent
          resources={filteredResources}
          activeTab={activeTab}
        />
      </TabsContent>
    </Tabs>
    </>
  );
}

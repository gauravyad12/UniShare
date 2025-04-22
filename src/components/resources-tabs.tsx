"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import MobileTabs from "@/components/mobile-tabs";
import ResourceTabContent from "@/components/resource-tab-content";

interface ResourcesTabsProps {
  resources: any[];
  initialTab: string;
  currentUserId: string;
}

export default function ResourcesTabs({ resources, initialTab, currentUserId }: ResourcesTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [filteredResources, setFilteredResources] = useState(resources);

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
    setActiveTab(value);

    // Update URL without navigation
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);

    // Update the URL without a full navigation
    window.history.pushState(null, "", `?${params.toString()}`);
  };

  return (
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
  );
}

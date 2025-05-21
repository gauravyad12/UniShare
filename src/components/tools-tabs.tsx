"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import MobileTabs from "@/components/mobile-tabs";

interface ToolsTabsProps {
  tools: any[];
  initialTab: string;
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

export default function ToolsTabs({ tools, initialTab }: ToolsTabsProps) {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [filteredTools, setFilteredTools] = useState(tools);

  // Callback to handle search params changes
  const handleParamsChange = useCallback((params: URLSearchParams) => {
    setSearchParams(params);
  }, []);

  // Filter tools based on active tab
  useEffect(() => {
    let filtered = [...tools];

    if (activeTab === "ai") {
      filtered = tools.filter(tool => tool.category === "ai");
    } else if (activeTab === "study") {
      filtered = tools.filter(tool => tool.category === "study");
    } else if (activeTab === "planning") {
      filtered = tools.filter(tool => tool.category === "planning");
    } else if (activeTab === "utility") {
      filtered = tools.filter(tool => tool.category === "utility");
    }

    setFilteredTools(filtered);
  }, [activeTab, tools]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    // Only proceed if the tab is actually changing
    if (value === activeTab) return;

    setActiveTab(value);

    // Use server-side navigation to update the URL
    if (searchParams) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);

      // Use router.push for server-side navigation
      router.push(`/dashboard/tools?${params.toString()}`);
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
            { value: "all", label: "All Tools" },
            { value: "ai", label: "AI Tools" },
            { value: "study", label: "Study Aids" },
            { value: "planning", label: "Planning" },
            { value: "utility", label: "Utilities" },
          ]}
          activeTab={activeTab}
          className="mb-6"
          onTabChange={handleTabChange}
        />

        {/* We don't need TabsContent here as the content is rendered by the parent component */}
      </Tabs>
    </>
  );
}

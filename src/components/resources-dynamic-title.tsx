"use client";

import DynamicPageTitle from "@/components/dynamic-page-title";

interface ResourcesDynamicTitleProps {
  viewedResource?: {
    title: string;
  } | null;
  activeTab?: string;
}

export default function ResourcesDynamicTitle({ 
  viewedResource, 
  activeTab 
}: ResourcesDynamicTitleProps) {
  // Generate the appropriate title based on the context
  let pageTitle = "UniShare | Resources";
  
  if (viewedResource) {
    // If viewing a specific resource, use its title
    pageTitle = `UniShare | ${viewedResource.title}`;
  } else if (activeTab && activeTab !== "all") {
    // If on a specific tab, include the tab name
    const tabName = formatTabName(activeTab);
    pageTitle = `UniShare | ${tabName}`;
  }
  
  return <DynamicPageTitle title={pageTitle} />;
}

// Helper function to format tab names
function formatTabName(tab: string): string {
  switch (tab) {
    case "notes":
      return "Notes";
    case "textbooks":
      return "Textbooks";
    case "solutions":
      return "Solutions";
    case "study-guides":
      return "Study Guides";
    case "practice-exams":
      return "Practice Exams";
    case "links":
      return "Links";
    case "my-uploads":
      return "My Uploads";
    default:
      return "Resources";
  }
}

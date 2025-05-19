"use client";

import DynamicPageTitle from "@/components/dynamic-page-title";

interface StudyGroupsDynamicTitleProps {
  viewedGroup?: {
    name: string;
  } | null;
  activeTab?: string;
  chatMode?: boolean;
}

export default function StudyGroupsDynamicTitle({ 
  viewedGroup, 
  activeTab,
  chatMode
}: StudyGroupsDynamicTitleProps) {
  // Generate the appropriate title based on the context
  let pageTitle = "UniShare | Study Groups";
  
  if (viewedGroup) {
    // If viewing a specific group
    if (chatMode) {
      pageTitle = `UniShare | ${viewedGroup.name} Chat`;
    } else {
      pageTitle = `UniShare | ${viewedGroup.name}`;
    }
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
    case "my-groups":
      return "My Study Groups";
    case "upcoming":
      return "Upcoming Meetings";
    default:
      return "Study Groups";
  }
}

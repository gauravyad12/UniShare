"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Brain,
  FileText,
  Headphones,
  Lightbulb,
  Lock,
  Sparkles,
  Globe,
  BookMarked,
  BarChart3,
  MessageSquare,
  FileQuestion,
  Upload,
  Mic,
  LayoutGrid
} from "lucide-react";
import DynamicPageTitle from "@/components/dynamic-page-title";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClientSubscriptionCheck } from "@/components/client-subscription-check";
import { Badge } from "@/components/ui/badge";
import ToolsTabs from "@/components/tools-tabs";
import { SubscriptionRequiredNotice } from "@/components/subscription-required-notice";

// Force dynamic rendering to handle search params
export const dynamic = "force-dynamic";

export default function ToolsPage({
  searchParams,
}: {
  searchParams: {
    tab?: string;
  };
}) {
  const activeTab = searchParams.tab || "all";

  // Define all Scholar+ tools
  const scholarPlusTools = [
    {
      id: "textbook-answers",
      name: "Textbook Answers",
      description: "Access solutions to popular textbooks and study materials",
      icon: BookMarked,
      category: "study",
      path: "/dashboard/tools/textbook-answers",
      comingSoon: false,
    },
    {
      id: "proxy-browser",
      name: "Proxy Browser",
      description: "Browse the web securely and privately within UniShare",
      icon: Globe,
      category: "utility",
      path: "/dashboard/tools/proxy-browser",
      comingSoon: false,
    },
    {
      id: "degree-roadmap",
      name: "Degree Roadmap",
      description: "Plan and share your academic journey with integrated resources",
      icon: BarChart3,
      category: "planning",
      path: "/dashboard/tools/degree-roadmap",
      comingSoon: false,
    },
    {
      id: "ai-essay-writer",
      name: "AI Essay Writer",
      description: "Get help drafting essays with customizable prompts and rubrics",
      icon: FileText,
      category: "ai",
      path: "/dashboard/tools/ai-essay-writer",
      comingSoon: false,
    },
    {
      id: "ai-document-chat",
      name: "AI Document Chat",
      description: "Upload PDFs, notes, or text and chat with an AI about the content",
      icon: MessageSquare,
      category: "ai",
      path: "/dashboard/tools/ai-document-chat",
      comingSoon: true,
    },
    {
      id: "ai-lecture-notes",
      name: "AI Lecture Note Taker",
      description: "Record lectures and get AI-generated notes, summaries, and flashcards",
      icon: Mic,
      category: "ai",
      path: "/dashboard/tools/ai-lecture-notes",
      comingSoon: true,
    },
  ];

  // No need for filtering here as it's now handled by the ScholarPlusTabs component

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      {/* Set dynamic page title */}
      <DynamicPageTitle title="UniShare | Tools" />

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <LayoutGrid className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Tools</h1>
        </div>
        <p className="text-muted-foreground">
          Access powerful features to enhance your academic success
        </p>
      </header>

      <ToolsTabs tools={scholarPlusTools} initialTab={activeTab} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-3 md:gap-x-4">
        {(activeTab === "all" ? scholarPlusTools : scholarPlusTools.filter(tool => tool.category === activeTab)).map((tool) => (
          <Card key={tool.id} className="overflow-hidden flex flex-col h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-primary/10 rounded-md">
                  <tool.icon className="h-5 w-5 text-primary" />
                </div>
                {tool.comingSoon && (
                  <Badge variant="outline" className="bg-primary/5 text-primary">
                    Coming Soon
                  </Badge>
                )}
              </div>
              <CardTitle className="mt-4">{tool.name}</CardTitle>
              <CardDescription>{tool.description}</CardDescription>
            </CardHeader>
            <CardFooter className="pt-2 mt-auto">
              <ClientSubscriptionCheck redirectTo="/pricing">
                <Button
                  asChild
                  className="w-full"
                  variant={tool.comingSoon ? "outline" : "default"}
                  disabled={tool.comingSoon}
                >
                  <Link href={tool.path}>
                    {tool.comingSoon ? "Coming Soon" : "Launch Tool"}
                  </Link>
                </Button>
              </ClientSubscriptionCheck>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* This component will only show if the user doesn't have an active subscription */}
      <SubscriptionRequiredNotice />
    </div>
  );
}

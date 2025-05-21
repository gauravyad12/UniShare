"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutGrid, ChevronRight, Lock, FileText, BookMarked, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { createClient } from "@/utils/supabase/client";

interface MobileToolsSectionProps {
  hasSubscription?: boolean;
}

export default function MobileToolsSection({ hasSubscription = false }: MobileToolsSectionProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Set loading to false after component mounts
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Featured tools for mobile view with more accurate icons
  const featuredTools = [
    {
      id: "ai-essay-writer",
      name: "AI Essay Writer",
      comingSoon: true,
      path: "/dashboard/tools/ai-essay-writer",
      icon: FileText,
    },
    {
      id: "textbook-answers",
      name: "Textbook Answers",
      comingSoon: false,
      path: "/dashboard/tools/textbook-answers",
      icon: BookMarked,
    },
    {
      id: "ai-document-chat",
      name: "AI Document Chat",
      comingSoon: true,
      path: "/dashboard/tools/ai-document-chat",
      icon: MessageSquare,
    },
  ];

  return (
    <section className="dashboard-mobile-section mb-6 no-border-radius">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Tools</h2>
        </div>
        <Link href="/dashboard/tools" className="text-xs text-primary flex items-center">
          View All <ChevronRight className="h-3 w-3 ml-1" />
        </Link>
      </div>

      <div className="space-y-3">
        {featuredTools.map((tool) => (
          <Card key={tool.id} className="p-3 flex items-center justify-between bg-background/70 backdrop-blur-md shadow-sm border border-primary/10">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-md">
                <tool.icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm">{tool.name}</span>
                  {tool.comingSoon && (
                    <Badge variant="outline" className="text-[10px] py-0 h-4 bg-primary/5 text-primary">
                      Soon
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button size="sm" variant="ghost" asChild disabled={tool.comingSoon} className="ml-auto">
              <Link href={tool.path}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        ))}

        {/* Only show upgrade section if user doesn't have a subscription */}
        {!isLoading && !hasSubscription && (
          <div className="bg-primary/5 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Scholar+ Features</span>
            </div>
            <Button size="sm" variant="outline" asChild className="h-8">
              <Link href="/pricing">Upgrade</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

interface Resource {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  is_external_link: boolean;
  file_url?: string;
  resource_type?: string;
  created_at: string;
  course_code?: string;
}

interface MobileResourcesSectionProps {
  resources: Resource[];
}

export default function MobileResourcesSection({
  resources,
}: MobileResourcesSectionProps) {
  // Track viewport width for responsive rendering
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  // Update viewport width on resize
  useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  const hasResources = resources.length > 0;

  return (
    <div className="bg-background rounded-xl shadow-sm border border-border/50 overflow-hidden mb-6">
      <div className="p-4 border-b border-border/50">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Recent Resources
          </h3>
          <Link href="/dashboard/resources" className="text-xs text-primary flex items-center">
            View All
            <ChevronRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </div>

      {/* Resources list */}
      <div className="p-4">
        {hasResources ? (
          <div className="space-y-4">
            {resources.slice(0, 3).map((resource, index) => (
              <div key={resource.id}>
                <Link
                  href={`/dashboard/resources?view=${resource.id}`}
                  className="flex gap-3 p-3 rounded-lg border border-border/50 bg-background hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-md bg-primary/5 flex items-center justify-center overflow-hidden">
                    {resource.thumbnail_url ? (
                      <img
                        src={resource.thumbnail_url}
                        alt={resource.title}
                        className="w-full h-full object-cover"
                        style={{
                          objectPosition: resource.file_url && resource.file_url.toLowerCase().endsWith(".pdf")
                            ? (viewportWidth < 768 ? 'center 10%' : 'center 10%')
                            : 'center top',
                          transform: resource.file_url && resource.file_url.toLowerCase().endsWith(".pdf") ? 'scale(1.1)' : 'none',
                        }}
                      />
                    ) : (
                      resource.is_external_link ? (
                        <ExternalLink className="h-6 w-6 text-primary/60" />
                      ) : (
                        <FileText className="h-6 w-6 text-primary/60" />
                      )
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {resource.course_code && (
                        <span className="px-1.5 py-0.5 bg-primary/10 rounded text-xs font-medium text-primary">
                          {resource.course_code}
                        </span>
                      )}
                      {resource.is_external_link && (
                        <span className="px-1.5 py-0.5 bg-secondary rounded text-xs font-medium">
                          Link
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-sm mt-1 truncate">{resource.title}</h4>
                    {resource.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {resource.description}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            ))}

            {resources.length > 3 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/resources">
                    View {resources.length - 3} more
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-muted-foreground text-sm mb-4">
              No resources available yet
            </p>
            <Button size="sm" asChild>
              <Link href="/dashboard/resources?upload=true">
                Upload Resource
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Link2, File } from "lucide-react";

interface ResourceThumbnailProps {
  resourceId: string;
  title: string;
  link: string;
}

export default function ResourceThumbnail({ resourceId, title, link }: ResourceThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [resourceType, setResourceType] = useState<string>('file');
  const [loading, setLoading] = useState(true);
  const [hasThumbnail, setHasThumbnail] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  // Update viewport width on resize
  useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  useEffect(() => {
    const fetchResourceDetails = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('resources')
          .select('thumbnail_url, resource_type')
          .eq('id', resourceId)
          .single();

        if (error) {
          console.error("Error fetching resource details:", error);
          setLoading(false);
          return;
        }

        // Set the resource type
        if (data?.resource_type) {
          setResourceType(data.resource_type);
        }

        // Only set thumbnail URL if it exists
        if (data && data.thumbnail_url) {
          setThumbnailUrl(data.thumbnail_url);
          setHasThumbnail(true);
        } else {
          setHasThumbnail(false);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error in fetchResourceDetails:", error);
        setLoading(false);
      }
    };

    if (resourceId) {
      fetchResourceDetails();
    }
  }, [resourceId]);

  // Render a default icon based on resource type when no thumbnail is available
  const renderDefaultIcon = () => {
    const iconSize = "h-12 w-12";
    const iconColor = "text-primary/70";

    if (resourceType === 'link') {
      return <Link2 className={`${iconSize} ${iconColor}`} />;
    } else {
      return <File className={`${iconSize} ${iconColor}`} />;
    }
  };

  return (
    <div className="rounded-lg overflow-hidden border border-solid border-secondary shadow-md">
      <Button
        variant="ghost"
        className="w-full p-0 h-auto flex flex-col text-left bg-card text-card-foreground hover:bg-muted rounded-none"
        asChild
      >
        <Link href={link}>
          {/* Resource Thumbnail */}
          <div className="w-full h-32 overflow-hidden relative bg-muted/30">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              </div>
            ) : hasThumbnail ? (
              <img
                src={thumbnailUrl || ''}
                alt={title}
                className="w-full object-cover"
                style={{
                  height: '100%', // Ensure the image fills the container
                  // Apply top offset only for non-link resources with different values for mobile/desktop
                  objectPosition: resourceType === 'link'
                    ? '0 0'
                    : (viewportWidth < 768 ? '0 -40px' : '0 -40px')
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                {renderDefaultIcon()}
              </div>
            )}
          </div>
          {/* Resource Title */}
          <div className="p-2.5 w-full">
            <span className="font-medium text-sm text-foreground line-clamp-2">{title}</span>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <FileText className="h-3 w-3 mr-1 text-primary" />
              View resource
            </div>
          </div>
        </Link>
      </Button>
    </div>
  );
}

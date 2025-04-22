"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, FileText, Share } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { Checkbox } from "./ui/checkbox";

interface ShareGroupResourceProps {
  groupId: string;
  onResourceSelected?: (resourceId: string, resourceTitle: string) => void;
}

export default function ShareGroupResource({
  groupId,
  onResourceSelected,
}: ShareGroupResourceProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);

  // Fetch group resources when the popover opens
  useEffect(() => {
    if (open) {
      fetchGroupResources();
    }
  }, [open, groupId]);

  // Search for resources when the search term changes
  useEffect(() => {
    if (!open) return;

    const searchResources = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        // If no search term, show all group resources
        fetchGroupResources();
        return;
      }

      setLoading(true);

      try {
        // Get all resources for this group and filter client-side
        const response = await fetch(`/api/study-groups/${groupId}/resources`);

        // Handle non-200 responses
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error response (${response.status}):`, errorText);
          throw new Error(`Failed to fetch resources: ${response.status}`);
        }

        const data = await response.json();

        // Check if we have a valid resources array
        if (!data || !Array.isArray(data.resources)) {
          console.warn('Invalid response format:', data);
          setResources([]);
          return;
        }

        // Filter resources by search term with null checks
        const filteredResources = (data.resources || []).filter((resource: any) =>
          resource && resource.title &&
          typeof resource.title === 'string' &&
          resource.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setResources(filteredResources);
      } catch (error) {
        console.error("Error searching resources:", error);
        setResources([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      searchResources();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm, groupId, open]);

  const fetchGroupResources = async () => {
    setLoading(true);

    try {
      // Get resources for this group using the API endpoint
      const response = await fetch(`/api/study-groups/${groupId}/resources`);

      // Handle non-200 responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response (${response.status}):`, errorText);
        throw new Error(`Failed to fetch resources: ${response.status}`);
      }

      // Parse the JSON response
      const data = await response.json();

      // Check if we have a valid resources array
      if (!data || !Array.isArray(data.resources)) {
        console.warn('Invalid response format:', data);
        setResources([]);
        return;
      }

      setResources(data.resources || []);
    } catch (error) {
      console.error("Error fetching group resources:", error);
      setResources([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleResourceSelect = (resourceId: string, resourceTitle: string) => {
    if (onResourceSelected) {
      onResourceSelected(resourceId, resourceTitle);
      setOpen(false);
      setSelectedResource(null);
      setSearchTerm("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-10 w-10 flex items-center justify-center p-0 aspect-square hover:bg-muted transition-colors"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 pb-0">
          <div className="font-medium mb-2">Share Resource</div>
          <div className="text-sm text-muted-foreground mb-4">
            Share a resource from this group's library
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto border-t">
          {loading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : resources.length > 0 ? (
            <div className="p-1">
              {resources.map((resource) => (
                <div
                  key={resource.resource_id || resource.id}
                  className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer"
                  onClick={() => handleResourceSelect(resource.resource_id || resource.id, resource.title)}
                >
                  <div className="flex-shrink-0 mr-3">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{resource.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {resource.description || "No description"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Added by {resource.creator_full_name || resource.creator_username || "Unknown"}
                      {resource.resource_creator_username && (
                        <span className="ml-2">
                          Created by {resource.resource_creator_full_name || resource.resource_creator_username}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-2">
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm.length > 1
                ? "No matching resources found"
                : "No resources available in this group"}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

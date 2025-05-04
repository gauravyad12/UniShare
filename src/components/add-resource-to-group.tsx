"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, FileText, Loader2, X, Check } from "lucide-react";

interface AddResourceToGroupProps {
  groupId: string;
  onResourceAdded?: () => void;
}

export default function AddResourceToGroup({
  groupId,
  onResourceAdded,
}: AddResourceToGroupProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [addingResources, setAddingResources] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "my">('all');

  // Helper function to handle SQL results
  const handleSqlResult = (sqlResult: any, creatorMap: Record<string, any>) => {
    // Check if sqlResult is an array
    const resultArray = Array.isArray(sqlResult) ? sqlResult :
                        (sqlResult.rows || sqlResult.data || []);

    console.log('Creators found via SQL:', resultArray.length);
    if (resultArray.length > 0) {
      console.log('Sample creator via SQL:', resultArray[0]);
    }

    // Create a map for easy lookup
    for (let i = 0; i < resultArray.length; i++) {
      const creator = resultArray[i];
      if (creator && creator.id) {
        creatorMap[creator.id] = creator;
      }
    }
  };

  // Search for resources when the search term changes or tab changes
  useEffect(() => {
    const searchResources = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setResources([]);
        return;
      }

      setLoading(true);
      const supabase = createClient();

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          console.error("You must be logged in to search resources");
          return;
        }

        // Base query - we'll fetch creator info separately
        let query = supabase
          .from("resources")
          .select("*")
          .ilike("title", `%${searchTerm}%`)
          .order("created_at", { ascending: false });

        // Filter by user's resources if on 'my' tab
        if (activeTab === "my") {
          query = query.eq("author_id", user.id);
        }

        // Execute query with limit
        const { data, error } = await query.limit(20);

        if (error) {
          console.error("Error searching resources:", error);
        } else {
          console.log('Resources found:', data.length);
          if (data.length > 0) {
            console.log('Sample resource:', data[0]);
          }

          // Get all creator IDs - use author_id instead of created_by
          const creatorIds = data
            .map((resource: any) => resource.author_id)
            .filter(Boolean);
          console.log('Author ID from sample:', data[0]?.author_id);

          console.log('Creator IDs found:', creatorIds.length);

          // Create a direct SQL query to get user profiles
          // This avoids any RLS issues
          let creatorMap = {};

          if (creatorIds.length > 0) {
            // Convert the array to a comma-separated string of quoted UUIDs
            const idList = creatorIds.map((id: string) => `'${id}'`).join(',');

            // Check if execute_sql RPC exists
            try {
              // Use a direct SQL query
              const { data: sqlResult, error: sqlError } = await supabase.rpc(
                'execute_sql',
                {
                  query: `
                    SELECT id, username, full_name
                    FROM user_profiles
                    WHERE id IN (${idList})
                  `
                }
              );

              if (sqlError) {
                throw sqlError;
              }

              if (sqlResult) {
                // Handle the SQL result
                handleSqlResult(sqlResult, creatorMap);
              }
            } catch (error) {
              console.error('Error with SQL query:', error);

              // Fallback to regular query
              const { data: creators, error: creatorsError } = await supabase
                .from("user_profiles")
                .select("id, username, full_name")
                .in("id", creatorIds);

              if (creatorsError) {
                console.error('Error fetching creators:', creatorsError);
              } else if (creators) {
                console.log('Creators found (fallback):', creators.length);
                if (creators.length > 0) {
                  console.log('Sample creator (fallback):', creators[0]);
                }

                // Create a map for easy lookup
                creators.forEach((creator: { id: string; [key: string]: any }) => {
                  creatorMap = { ...creatorMap, [creator.id]: creator };
                });
              }

            }

            console.log('Creator map created with keys:', Object.keys(creatorMap));
          }

          // Add creator info to each resource - use author_id instead of created_by
          const resourcesWithCreators = (data || []).map((resource: any) => {
            const creator = resource.author_id ? (creatorMap as any)[resource.author_id] : null;

            if (resource.author_id) {
              console.log(
                `Resource ${resource.id} created by ${resource.author_id}, ` +
                `found creator: ${creator ? 'yes' : 'no'}, ` +
                `name: ${creator?.full_name || creator?.username || 'unknown'}`
              );
            }

            // If we don't have creator info but have author_id, we'll fetch it on demand in the UI
            return {
              ...resource,
              creator_info: creator
            };
          });

          console.log('Final resources with creators:', resourcesWithCreators.map((r: any) => ({
            id: r.id,
            author_id: r.author_id,
            has_creator_info: !!r.creator_info
          })));

          console.log('Total resources with creators:', resourcesWithCreators.length);
          setResources(resourcesWithCreators || []);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      searchResources();
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchTerm, activeTab]);

  const handleAddResources = async () => {
    if (selectedResources.length === 0) {
      console.error("No resources selected. Please select at least one resource to add");
      return;
    }

    setAddingResources(true);
    const supabase = createClient();

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error("You must be logged in to add resources");
        return;
      }

      console.log('Adding resources to group:', {
        groupId,
        selectedResources,
        userId: user.id
      });

      // Process resources one by one using the API endpoint
      // This avoids triggering the recursive policy
      const results = [];

      for (const resourceId of selectedResources) {
        try {
          console.log(`Processing resource ${resourceId}`);

          // Use the API endpoint to add the resource
          console.log(`Adding resource ${resourceId} to group ${groupId}`);
          const response = await fetch('/api/study-groups/add-resource', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              groupId,
              resourceId
            })
          });

          console.log(`Response status for resource ${resourceId}:`, response.status);

          let data;
          try {
            data = await response.json();
            console.log(`Response data for resource ${resourceId}:`, data);
          } catch (parseError) {
            console.error(`Error parsing JSON response for resource ${resourceId}:`, parseError);
            const text = await response.text();
            console.log(`Raw response text for resource ${resourceId}:`, text);
            throw new Error(`Failed to parse response: ${(parseError as Error).message}`);
          }

          if (!response.ok) {
            console.error(`Error adding resource ${resourceId}:`, data.error);
            results.push({
              success: false,
              resourceId,
              error: data.error,
              message: data.error || "Error adding resource"
            });
          } else if (data.alreadyExists) {
            console.log(`Resource ${resourceId} already in group`);
            results.push({
              success: true,
              resourceId,
              message: "Resource already in group"
            });
          } else {
            console.log(`Successfully added resource ${resourceId}`);
            results.push({
              success: true,
              resourceId,
              message: data.message || "Resource added successfully"
            });
          }
        } catch (error) {
          console.error(`Unexpected error processing resource ${resourceId}:`, error);
          results.push({ success: false, resourceId, error, message: "Unexpected error" });
        }
      }

      // Count successful additions
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.length - successCount;

      console.log('Results summary:', {
        total: results.length,
        success: successCount,
        error: errorCount,
        results
      });

      if (successCount > 0) {
        console.log(`Successfully added ${successCount} resource${successCount > 1 ? 's' : ''} to the group${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);

        // Force a delay before calling the callback to ensure the database has time to update
        setTimeout(() => {
          // Call the callback if provided
          if (onResourceAdded) {
            onResourceAdded();
          }
        }, 500);

        // Close the dialog
        setOpen(false);
        setSelectedResources([]);
        setSearchTerm("");
      } else if (errorCount > 0) {
        // Get the first error message to display
        const firstError = results.find(r => !r.success);
        const errorMessage = firstError?.error?.message || firstError?.message || "Unknown error";

        console.error(`Failed to add resources: ${errorMessage}`);
      } else {
        console.log("No resources were added to the group");
      }
    } catch (error) {
      console.error("Error adding resources:", error);
    } finally {
      setAddingResources(false);
    }
  };

  const toggleResourceSelection = (resourceId: string) => {
    setSelectedResources(prev =>
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Resources to Group</DialogTitle>
          <DialogDescription>
            Search for resources to add to this study group.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <Label htmlFor="resource-search" className="text-sm font-medium">Search Resources</Label>
              <div className="flex border rounded-full overflow-hidden w-full sm:w-auto" style={{ minHeight: '36px'}}>
                <button
                  className={`px-4 text-sm flex-1 sm:flex-none transition-colors h-full flex items-center justify-center ${activeTab === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  onClick={() => setActiveTab('all')}
                  style={{ minHeight: '36px'}}
                >
                  All Resources
                </button>
                <button
                  className={`px-4 text-sm flex-1 sm:flex-none transition-colors h-full flex items-center justify-center ${activeTab === 'my' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  onClick={() => setActiveTab('my')}
                  style={{ minHeight: '36px'}}
                >
                  My Resources
                </button>
              </div>
            </div>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="resource-search"
                placeholder="Search by title..."
                className="pl-10 pr-10 py-2 rounded-full h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-foreground rounded-full flex items-center justify-center"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="border rounded-lg p-3 max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : resources.length > 0 ? (
              <div className="space-y-3">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-start space-x-3 p-3 hover:bg-muted rounded-lg border border-muted/40 transition-colors"
                  >
                    <div
                      className="flex-shrink-0 mt-1 relative w-4 h-4 rounded-sm border border-primary"
                      onClick={() => toggleResourceSelection(resource.id)}
                    >
                      {selectedResources.includes(resource.id) && (
                        <div className="absolute inset-0 bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      <input
                        type="checkbox"
                        id={`resource-${resource.id}`}
                        checked={selectedResources.includes(resource.id)}
                        onChange={() => toggleResourceSelection(resource.id)}
                        className="sr-only"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`resource-${resource.id}`}
                        className="text-sm font-medium cursor-pointer line-clamp-1 block"
                      >
                        {resource.title}
                      </label>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {resource.description || "No description"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground inline-flex items-center">
                          {activeTab === "my" ? "Your resource" :
                            (() => {
                              // Try to get the creator name from user_profiles
                              const supabase = createClient();

                              // Use a direct approach to get the creator name
                              if (resource.author_id) {
                                // We'll fetch the creator info directly here
                                supabase
                                  .from('user_profiles')
                                  .select('username, full_name')
                                  .eq('id', resource.author_id)
                                  .single()
                                  .then(({ data }: { data: any }) => {
                                    if (data) {
                                      // Update the DOM directly since we're in a render function
                                      const creatorElement = document.getElementById(`creator-${resource.id}`);
                                      if (creatorElement) {
                                        creatorElement.textContent = `By ${data.full_name || data.username || 'Unknown'}`;
                                      }
                                    }
                                  })
                                  .catch((err: Error) => console.error('Error fetching creator:', err));

                                // Return a placeholder with an ID we can update
                                return <span id={`creator-${resource.id}`}>Loading creator...</span>;
                              } else if (resource.creator_info) {
                                return `By ${resource.creator_info.full_name || resource.creator_info.username || "Unknown"}`;
                              } else {
                                return "By resource creator";
                              }
                            })()
                          }
                        </span>
                        <span className="inline-flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                          <FileText className="h-3 w-3 mr-1" />
                          {resource.resource_type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm.length > 1 ? (
              <div className="text-center py-6 text-muted-foreground">
                No resources found
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setSelectedResources([]);
              setSearchTerm("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddResources}
            disabled={selectedResources.length === 0 || addingResources}
          >
            {addingResources ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>Add Selected</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

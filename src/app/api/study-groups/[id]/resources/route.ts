import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Helper function to process resources
async function processResources(supabase, groupResources, groupId) {
  try {
    if (!groupResources || groupResources.length === 0) {
      return NextResponse.json({ resources: [] });
    }

    // Get the resource IDs
    const resourceIds = groupResources.map(item => item.resource_id);

    // Get the resources
    const { data: resources, error: resourcesError } = await supabase
      .from("resources")
      .select("*")
      .in("id", resourceIds);

    if (resourcesError) {
      console.error("Error fetching resources:", resourcesError);
      return NextResponse.json(
        { error: "Failed to fetch resources" },
        { status: 500 }
      );
    }

    // Get the resource creators (separate query to avoid foreign key issues)
    const creatorUserIds = resources
      .map(resource => resource.created_by)
      .filter(Boolean);

    let creatorProfiles = [];
    if (creatorUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("id, username, full_name")
        .in("id", creatorUserIds);

      if (!profilesError) {
        creatorProfiles = profiles || [];
      } else {
        console.error("Error fetching creator profiles:", profilesError);
      }
    }

    // Get the creators
    const creatorIds = groupResources.map(item => item.added_by).filter(Boolean);

    const { data: creators, error: creatorsError } = await supabase
      .from("user_profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", creatorIds);

    if (creatorsError) {
      console.error("Error fetching creators:", creatorsError);
      // Continue anyway, we'll just have missing creator info
    }

    // Create a map of resources by ID for easy lookup
    const resourceMap = {};
    resources.forEach(resource => {
      resourceMap[resource.id] = resource;
    });

    // Create a map of creators by ID for easy lookup
    const creatorMap = {};
    if (creators) {
      creators.forEach(creator => {
        creatorMap[creator.id] = creator;
      });
    }

    // Create a map of resource creators by ID
    const resourceCreatorMap = {};
    if (creatorProfiles) {
      creatorProfiles.forEach(profile => {
        resourceCreatorMap[profile.id] = profile;
      });
    }

    // Format the response to include both resource and creator info
    const formattedResources = groupResources.map(item => {
      try {
        // Make sure we have a valid resource
        if (!item.resource_id || !resourceMap[item.resource_id]) {
          console.warn(`Resource not found for ID: ${item.resource_id}`);
          return null; // Will be filtered out later
        }

        const resource = resourceMap[item.resource_id] || {};
        const creator = creatorMap[item.added_by] || {};

        // Get the resource creator profile if available
        const resourceCreator = resource.created_by ? resourceCreatorMap[resource.created_by] : null;

        return {
          id: item.id,
          resource_id: item.resource_id,
          added_by: item.added_by,
          title: resource.title || "Untitled Resource",
          description: resource.description || "",
          resource_type: resource.resource_type || "unknown",
          file_url: resource.file_url || "",
          external_link: resource.external_link || "",
          resource_created_at: resource.created_at || "",
          resource_created_by: resource.created_by || "",
          creator_username: creator.username || "",
          creator_full_name: creator.full_name || "",
          creator_avatar_url: creator.avatar_url || "",
          resource_creator_username: resourceCreator?.username || "",
          resource_creator_full_name: resourceCreator?.full_name || ""
        };
      } catch (err) {
        console.error(`Error formatting resource ${item.resource_id}:`, err);
        return null; // Will be filtered out later
      }
    }).filter(Boolean); // Remove any null entries

    return NextResponse.json({ resources: formattedResources });
  } catch (error) {
    console.error("Error in processResources:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const groupId = params.id;

    if (!groupId) {
      return NextResponse.json(
        { error: "Study group ID is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching resources for study group: ${groupId}`);

    // Use the raw SQL function to bypass RLS policies
    const { data: rawResult, error: sqlError } = await supabase
      .rpc('fetch_study_group_resources_raw', {
        p_group_id: groupId
      });

    if (sqlError) {
      console.error("Error executing SQL function:", sqlError);
      return NextResponse.json(
        { error: `Failed to fetch study group resources: ${sqlError.message}` },
        { status: 500 }
      );
    }

    console.log('Raw SQL result received');

    // Parse the JSON result
    let resources = [];
    try {
      if (rawResult) {
        resources = JSON.parse(rawResult);
        console.log(`Parsed ${resources.length} resources from SQL result`);
      } else {
        console.log('No resources found (null result)');
      }
    } catch (parseError) {
      console.error("Error parsing SQL result:", parseError);
      console.log("Raw result:", rawResult);
      return NextResponse.json(
        { error: `Failed to parse resources: ${parseError.message}` },
        { status: 500 }
      );
    }

    // If no resources, return empty array
    if (!resources || resources.length === 0) {
      return NextResponse.json({ resources: [] });
    }

    // The resources are already formatted by the SQL function
    const formattedResources = resources;

    // Return the formatted resources
    return NextResponse.json({ resources: formattedResources });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

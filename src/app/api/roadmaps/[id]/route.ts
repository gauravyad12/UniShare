import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// PUT /api/roadmaps/[id] - Update a roadmap
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const roadmapId = params.id;
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Verify user owns the roadmap
    const { data: roadmap } = await supabase
      .from("degree_roadmaps")
      .select("id")
      .eq("id", roadmapId)
      .eq("user_id", profile.id)
      .single();

    if (!roadmap) {
      return NextResponse.json(
        { error: "Roadmap not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      major,
      expected_graduation,
      total_credits,
      is_public
    } = body;

    // Validate required fields
    if (!name || !major) {
      return NextResponse.json(
        { error: "Name and major are required" },
        { status: 400 }
      );
    }

    // Validate total_credits - only validate if it's provided and not 0
    if (total_credits !== undefined && total_credits !== null && total_credits > 0 && (total_credits < 30 || total_credits > 200)) {
      return NextResponse.json(
        { error: "Total credits must be between 30 and 200" },
        { status: 400 }
      );
    }

    // If total_credits is 0 or not provided, use a default value
    const finalTotalCredits = total_credits && total_credits > 0 ? total_credits : 120;

    // Update the roadmap
    const { data: updatedRoadmap, error } = await supabase
      .from("degree_roadmaps")
      .update({
        name,
        major,
        expected_graduation,
        total_credits: finalTotalCredits,
        is_public,
        updated_at: new Date().toISOString()
      })
      .eq("id", roadmapId)
      .eq("user_id", profile.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating roadmap:", error);
      return NextResponse.json(
        { error: "Failed to update roadmap" },
        { status: 500 }
      );
    }

    return NextResponse.json({ roadmap: updatedRoadmap });
  } catch (error) {
    console.error("Error in PUT /api/roadmaps/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/roadmaps/[id] - Delete a roadmap
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const roadmapId = params.id;
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Verify user owns the roadmap
    const { data: roadmap } = await supabase
      .from("degree_roadmaps")
      .select("id")
      .eq("id", roadmapId)
      .eq("user_id", profile.id)
      .single();

    if (!roadmap) {
      return NextResponse.json(
        { error: "Roadmap not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the roadmap (this will cascade delete related courses and semesters)
    const { error: deleteError } = await supabase
      .from("degree_roadmaps")
      .delete()
      .eq("id", roadmapId)
      .eq("user_id", profile.id);

    if (deleteError) {
      console.error("Error deleting roadmap:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete roadmap" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Roadmap deleted successfully" 
    });
  } catch (error) {
    console.error("Error in DELETE /api/roadmaps/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
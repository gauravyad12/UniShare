import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's lecture recordings
    const { data: recordings, error: fetchError } = await supabase
      .from('lecture_recordings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching lecture recordings:', fetchError);
      return NextResponse.json(
        { error: "Failed to fetch lecture recordings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ recordings });

  } catch (error) {
    console.error('Error in lecture fetch:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
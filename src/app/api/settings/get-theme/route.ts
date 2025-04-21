import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    // If user is not logged in, return no theme
    if (!userData?.user) {
      return NextResponse.json({ theme: null });
    }

    // Get user's theme preference from database
    const { data, error } = await supabase
      .from("user_settings")
      .select("theme_preference")
      .eq("user_id", userData.user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ theme: null });
    }

    return NextResponse.json({ theme: data.theme_preference });
  } catch (error) {
    console.error("Error getting theme:", error);
    return NextResponse.json({ theme: null });
  }
}

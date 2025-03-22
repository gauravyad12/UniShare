import { createBrowserClient } from "@supabase/ssr";

export function createClientOnlyClient() {
  // Check if environment variables are available and provide fallback for development
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase URL or Anon Key is missing. Check your environment variables.",
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

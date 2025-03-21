import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  );

  // Make supabase available globally for theme sync
  if (typeof window !== "undefined") {
    (window as any).supabaseClient = supabaseClient;
  }

  return supabaseClient;
}

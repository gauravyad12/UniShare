import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// This is a compatibility layer for pages directory
// It doesn't use next/headers which is only available in app directory
export const createClient = async () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
};

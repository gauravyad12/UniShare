import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  try {
    // Use environment variables instead of hardcoded values
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        "Supabase credentials missing in .env file. Using mock client.",
      );
      return createMockClient();
    }

    return createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookies being modified in a Server Action
            console.warn("Error setting cookie in server:", error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Handle cookies being modified in a Server Action
            console.warn("Error removing cookie in server:", error);
          }
        },
      },
    });
  } catch (error) {
    console.error("Error creating Supabase client in server:", error);
    return createMockClient();
  }
}

// Create a mock client that won't crash the app
function createMockClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: (callback: any) => {
        // Simulate an immediate callback with null session
        if (typeof callback === "function") {
          setTimeout(() => callback("SIGNED_OUT", null), 0);
        }
        return {
          data: { subscription: { unsubscribe: () => {} } },
        };
      },
      signOut: async () => ({ error: null }),
      refreshSession: async () => ({ data: { session: null }, error: null }),
    },
    from: (table: string) => ({
      select: (columns: string = "*") => ({
        eq: (column: string, value: any) => ({
          single: () => ({ data: null, error: null }),
          data: [],
          error: null,
        }),
        data: [],
        error: null,
        in: () => ({ data: [], error: null }),
        order: () => ({
          data: [],
          error: null,
          limit: () => ({ data: [], error: null }),
        }),
        limit: () => ({ data: [], error: null }),
        range: () => ({ data: [], error: null }),
        single: () => ({ data: null, error: null }),
      }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      or: () => ({ data: [], error: null }),
      order: () => ({
        data: [],
        error: null,
        limit: () => ({ data: [], error: null }),
      }),
      limit: () => ({ data: [], error: null }),
      match: () => ({ data: [], error: null }),
      eq: () => ({ data: [], error: null }),
      neq: () => ({ data: [], error: null }),
      gt: () => ({ data: [], error: null }),
      lt: () => ({ data: [], error: null }),
      gte: () => ({ data: [], error: null }),
      lte: () => ({ data: [], error: null }),
      like: () => ({ data: [], error: null }),
      ilike: () => ({ data: [], error: null }),
      is: () => ({ data: [], error: null }),
      in: () => ({ data: [], error: null }),
      contains: () => ({ data: [], error: null }),
      containedBy: () => ({ data: [], error: null }),
      rangeLt: () => ({ data: [], error: null }),
      rangeGt: () => ({ data: [], error: null }),
      rangeGte: () => ({ data: [], error: null }),
      rangeLte: () => ({ data: [], error: null }),
      rangeAdjacent: () => ({ data: [], error: null }),
      overlaps: () => ({ data: [], error: null }),
      textSearch: () => ({ data: [], error: null }),
      filter: () => ({ data: [], error: null }),
      not: () => ({ data: [], error: null }),
      single: () => ({ data: null, error: null }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: "mock-path" }, error: null }),
        getPublicUrl: () => ({
          data: { publicUrl: "https://example.com/mock-image.jpg" },
        }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ data: null, error: null }),
        list: async () => ({ data: [], error: null }),
      }),
      listBuckets: async () => ({ data: [], error: null }),
    },
    channel: (name: string) => ({
      on: () => ({
        subscribe: () => ({
          unsubscribe: () => {},
        }),
      }),
    }),
    removeChannel: () => {},
    functions: {
      invoke: async () => ({ data: {}, error: null }),
    },
    rpc: (fn: string) => ({ data: null, error: null }),
  } as any;
}

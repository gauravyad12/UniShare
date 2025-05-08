import { createBrowserClient } from "@supabase/ssr";

// Cache the client to avoid creating multiple instances
let cachedClient: ReturnType<typeof createBrowserClient> | null = null;
let usedMockClient = false;

export function createClientOnlyClient() {
  // Return cached client if available
  if (cachedClient) return cachedClient;
  // If we've already determined we need to use a mock client, don't try again
  if (usedMockClient) return createMockClient();

  try {
    // Use environment variables instead of hardcoded values
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Always use mock client if env vars are missing
    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        "Supabase credentials missing in .env file. Using mock client.",
      );
      usedMockClient = true;
      return createMockClient();
    }

    // Create the client with the available credentials
    try {
      cachedClient = createBrowserClient(supabaseUrl, supabaseKey);
      return cachedClient;
    } catch (clientError) {
      console.error("Error creating Supabase client:", clientError);
      usedMockClient = true;
      return createMockClient();
    }
  } catch (error) {
    console.error("Unexpected error in createClientOnlyClient:", error);
    usedMockClient = true;
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
      signInWithOAuth: async () => ({ data: null, error: null }),
      signInWithPassword: async () => ({ data: null, error: null }),
      resetPasswordForEmail: async () => ({ data: null, error: null }),
      updateUser: async () => ({ data: { user: null }, error: null }),
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

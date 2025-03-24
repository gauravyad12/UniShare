import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with admin privileges using the service role key.
 * This client has full access to all tables without RLS restrictions.
 */
export function createAdminClient() {
  try {
    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials for admin client");
      return null;
    }

    // Create admin client with service role key
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
        },
      },
    });
  } catch (error) {
    console.error("Failed to create admin client:", error);
    return null;
  }
}

/**
 * Execute a raw SQL query using the admin client.
 * This is useful for operations that can't be done through the regular API.
 */
export async function executeRawSql(adminClient, sql, params = []) {
  try {
    // Convert params array to jsonb format expected by the function
    // Note: The function expects params as a JSONB array
    const jsonbParams = JSON.stringify(params);

    // Call the execute_sql function with the correct parameter order
    // The function signature is execute_sql(query text, params jsonb)
    const { data, error } = await adminClient.rpc("execute_sql", {
      query: sql,
      params: jsonbParams,
    });

    if (error) throw error;

    // Check if the result contains an error field (from the function's exception handler)
    if (data && data.error) {
      console.error("SQL execution returned error:", data.error);
      return { data: null, error: new Error(data.error) };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Raw SQL execution error:", error);
    return { data: null, error };
  }
}

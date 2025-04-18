import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with admin privileges using the service role key.
 * This client has full access to all tables without RLS restrictions.
 */
export function createAdminClient() {
  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Hardcoded values for development/testing - ONLY USE IN DEVELOPMENT
    const fallbackUrl = "https://ncvinrzllkqlypnyluco.supabase.co";
    const fallbackKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Missing Supabase admin credentials, using fallback authentication");

      // If we don't have admin credentials, use the anon key as a fallback
      // This won't have admin privileges but will allow the app to function
      if (fallbackUrl && fallbackKey) {
        console.log("Using fallback authentication for admin operations");
        return createClient(fallbackUrl, fallbackKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          db: {
            schema: "public",
          },
        });
      }

      console.error("No fallback credentials available");
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
 * Increment a column value in a table using the admin client.
 * This is a specialized function for incrementing the invite code usage count.
 */
export async function executeRawSql(adminClient, sql, params = []) {
  try {
    console.log(`Incrementing invite code usage for ID: ${params[0]}`);

    // First get the current value
    const { data: currentData, error: selectError } = await adminClient
      .from('invite_codes')
      .select('current_uses')
      .eq('id', params[0])
      .single();

    if (selectError) {
      console.error("Error fetching current invite code usage:", selectError);
      throw selectError;
    }

    // Increment the value
    const currentUses = currentData?.current_uses || 0;
    const { data, error: updateError } = await adminClient
      .from('invite_codes')
      .update({ current_uses: currentUses + 1 })
      .eq('id', params[0])
      .select('id, current_uses');

    if (updateError) {
      console.error("Error updating invite code usage:", updateError);
      throw updateError;
    }

    console.log(`Successfully updated invite code usage to ${currentUses + 1}`);
    return { data, error: null };
  } catch (error) {
    console.error("Error incrementing invite code usage:", error);
    return { data: null, error };
  }
}

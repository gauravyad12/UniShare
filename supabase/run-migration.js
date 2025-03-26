// Script to run the migration using environment variables
const { execSync } = require("child_process");

try {
  // Get the migration file path from command line arguments or use default
  const migrationFile =
    process.argv[2] ||
    "supabase/migrations/20240786000001_reapply_rls_for_user_tables.sql";

  // Construct the curl command using environment variables
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY",
    );
  }

  const command = `curl -X POST "${supabaseUrl}/rest/v1/sql" \
    -H "apikey: ${serviceKey}" \
    -H "Authorization: Bearer ${serviceKey}" \
    -H "Content-Type: application/json" \
    -d "$(cat ${migrationFile} | sed 's/\"/\\\"/g' | tr -d '\n' | sed 's/^/{ "query": "/' | sed 's/$/" }/')"`;

  // Execute the command
  console.log("Running migration...");
  const output = execSync(command, { encoding: "utf8" });
  console.log("Migration completed successfully!");
  console.log(output);
} catch (error) {
  console.error("Error running migration:", error.message);
  process.exit(1);
}

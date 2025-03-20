-- Ensure user_profiles has proper RLS policies for public access
DROP POLICY IF EXISTS "Allow public read access to user_profiles" ON user_profiles;
CREATE POLICY "Allow public read access to user_profiles"
  ON user_profiles FOR SELECT
  USING (true);

-- Ensure the table is enabled for realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'user_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
  END IF;
END
$$;

-- Ensure RLS is enabled on the table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Ensure resources table has proper RLS policies for public access
DROP POLICY IF EXISTS "Allow public read access to resources" ON resources;
CREATE POLICY "Allow public read access to resources"
  ON resources FOR SELECT
  USING (is_approved = true);

-- Ensure study_groups table has proper RLS policies for public access
DROP POLICY IF EXISTS "Allow public read access to study_groups" ON study_groups;
CREATE POLICY "Allow public read access to study_groups"
  ON study_groups FOR SELECT
  USING (is_private = false);

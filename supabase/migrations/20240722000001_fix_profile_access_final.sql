-- Fix profile access issues

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public access to user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow public read access to user_profiles" ON user_profiles;

-- Create a simple policy that allows anyone to view profiles
CREATE POLICY "Anyone can view profiles"
ON user_profiles FOR SELECT
USING (true);

-- Don't try to add to realtime again since it's already there
-- Check if it's already in the publication before adding
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
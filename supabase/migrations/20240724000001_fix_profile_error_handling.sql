-- Ensure user_profiles table has proper RLS policies for public access
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;

-- Create policy to allow anyone to view user profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

-- Ensure resources table has proper RLS policies for public access to approved resources
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public approved resources are viewable by everyone" ON resources;

-- Create policy to allow anyone to view approved resources
CREATE POLICY "Public approved resources are viewable by everyone"
  ON resources FOR SELECT
  USING (is_approved = true);

-- Ensure study_groups table has proper RLS policies for public access to non-private groups
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public study groups are viewable by everyone" ON study_groups;

-- Create policy to allow anyone to view non-private study groups
CREATE POLICY "Public study groups are viewable by everyone"
  ON study_groups FOR SELECT
  USING (is_private = false);

-- Ensure realtime is enabled for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE resources;
ALTER PUBLICATION supabase_realtime ADD TABLE study_groups;

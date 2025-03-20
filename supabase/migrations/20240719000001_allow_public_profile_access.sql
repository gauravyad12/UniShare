-- Allow public access to user profiles

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view their own profiles" ON user_profiles;

-- Create new policy that allows public access to user profiles
CREATE POLICY "Public access to user profiles"
ON user_profiles FOR SELECT
USING (true);

-- Also ensure resources and study groups have public access policies

-- For resources
DROP POLICY IF EXISTS "Public access to resources" ON resources;
CREATE POLICY "Public access to resources"
ON resources FOR SELECT
USING (is_approved = true);

-- For study groups
DROP POLICY IF EXISTS "Public access to study groups" ON study_groups;
CREATE POLICY "Public access to study groups"
ON study_groups FOR SELECT
USING (is_private = false);

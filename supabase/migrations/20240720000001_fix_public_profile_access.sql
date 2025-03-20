-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow public access to user profiles" ON user_profiles;

-- Create a new policy that allows anyone to view user profiles
CREATE POLICY "Allow public access to user profiles"
ON user_profiles FOR SELECT
USING (true);

-- Ensure resources are publicly accessible if approved
DROP POLICY IF EXISTS "Resources are viewable by anyone if approved" ON resources;
CREATE POLICY "Resources are viewable by anyone if approved"
ON resources FOR SELECT
USING (is_approved = true);

-- Ensure study groups are publicly accessible if not private
DROP POLICY IF EXISTS "Study groups are viewable by anyone if not private" ON study_groups;
CREATE POLICY "Study groups are viewable by anyone if not private"
ON study_groups FOR SELECT
USING (is_private = false);

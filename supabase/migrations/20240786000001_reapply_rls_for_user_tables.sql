-- Re-enable RLS on user_followers table with stronger policies
ALTER TABLE user_followers ENABLE ROW LEVEL SECURITY;

-- Create policies for user_followers with explicit permissions
DROP POLICY IF EXISTS "Users can view followers" ON user_followers;
CREATE POLICY "Users can view followers"
  ON user_followers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON user_followers;
CREATE POLICY "Users can follow others"
  ON user_followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON user_followers;
CREATE POLICY "Users can unfollow"
  ON user_followers FOR DELETE
  USING (auth.uid() = follower_id);

-- Re-enable RLS on user_profiles table with comprehensive policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Re-enable RLS on user_settings table with strict access controls
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_settings
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Ensure service role can access all records when needed
DROP POLICY IF EXISTS "Service role can access all user_followers" ON user_followers;
CREATE POLICY "Service role can access all user_followers"
  ON user_followers FOR ALL
  TO service_role
  USING (true);

DROP POLICY IF EXISTS "Service role can access all user_profiles" ON user_profiles;
CREATE POLICY "Service role can access all user_profiles"
  ON user_profiles FOR ALL
  TO service_role
  USING (true);

DROP POLICY IF EXISTS "Service role can access all user_settings" ON user_settings;
CREATE POLICY "Service role can access all user_settings"
  ON user_settings FOR ALL
  TO service_role
  USING (true);

-- Tables are already part of the realtime publication
-- No need to add them again

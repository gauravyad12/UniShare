-- Enable RLS on user_followers table
ALTER TABLE user_followers ENABLE ROW LEVEL SECURITY;

-- Create policies for user_followers
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

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Enable RLS on user_settings table
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_settings
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Add realtime support for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_followers;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;

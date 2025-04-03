-- Create functions to increment and decrement follower and following counts

-- Function to increment follower count
CREATE OR REPLACE FUNCTION increment_follower_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET follower_count = follower_count + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement follower count
CREATE OR REPLACE FUNCTION decrement_follower_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET follower_count = GREATEST(follower_count - 1, 0)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment following count
CREATE OR REPLACE FUNCTION increment_following_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET following_count = following_count + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement following count
CREATE OR REPLACE FUNCTION decrement_following_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET following_count = GREATEST(following_count - 1, 0)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Make sure user_profiles table has follower_count and following_count columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'follower_count') THEN
    ALTER TABLE user_profiles ADD COLUMN follower_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'following_count') THEN
    ALTER TABLE user_profiles ADD COLUMN following_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Update existing counts based on actual relationships
UPDATE user_profiles up
SET follower_count = (
  SELECT COUNT(*) FROM user_followers uf 
  WHERE uf.user_id = up.id
);

UPDATE user_profiles up
SET following_count = (
  SELECT COUNT(*) FROM user_followers uf 
  WHERE uf.follower_id = up.id
);

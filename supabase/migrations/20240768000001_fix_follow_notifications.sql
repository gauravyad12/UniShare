-- Revert changes and implement a simpler solution

-- First, check if actor_id exists and drop it if it does
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'notifications' AND column_name = 'actor_id') THEN
    ALTER TABLE notifications DROP COLUMN actor_id;
  END IF;
END
$$;

-- Recreate the follow notification function with a simpler approach
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
DECLARE
  follower_username TEXT;
BEGIN
  -- Get follower's username
  SELECT username INTO follower_username FROM user_profiles WHERE id = NEW.follower_id;
  
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (
    NEW.user_id,
    'New Follower',
    'User @' || COALESCE(follower_username, 'someone') || ' started following you',
    'follow',
    '/u/' || COALESCE(follower_username, NEW.follower_id::text)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS new_follower_trigger ON user_followers;
DROP TRIGGER IF EXISTS on_new_follow ON user_followers;

-- Create new trigger
CREATE TRIGGER new_follower_trigger
  AFTER INSERT ON user_followers
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_follow();

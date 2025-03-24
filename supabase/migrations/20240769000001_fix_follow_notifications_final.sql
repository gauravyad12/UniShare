-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS new_follower_trigger ON user_followers;
DROP TRIGGER IF EXISTS on_new_follow ON user_followers;

-- Recreate the follow notification function without using actor_id
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

-- Create new trigger with the fixed function
CREATE TRIGGER new_follower_trigger
  AFTER INSERT ON user_followers
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_follow();

-- Add actor_id column to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create a more robust notification function for follows
CREATE OR REPLACE FUNCTION handle_new_follow()
RETURNS TRIGGER AS $$
DECLARE
  follower_username TEXT;
  follower_name TEXT;
BEGIN
  -- Get follower information
  SELECT username, full_name INTO follower_username, follower_name 
  FROM user_profiles 
  WHERE id = NEW.follower_id;
  
  -- Insert notification with proper actor_id and improved link format
  INSERT INTO notifications (
    user_id, 
    title, 
    message, 
    type, 
    link, 
    actor_id,
    created_at
  )
  VALUES (
    NEW.user_id,
    'New Follower',
    COALESCE('User @' || follower_username, follower_name, 'Someone') || ' started following you',
    'follow',
    '/u/' || COALESCE(follower_username, NEW.follower_id::text),
    NEW.follower_id,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS new_follower_trigger ON user_followers;

-- Create new trigger with the improved function
CREATE TRIGGER on_new_follow
AFTER INSERT ON user_followers
FOR EACH ROW
EXECUTE FUNCTION handle_new_follow();

-- Update existing notifications to set actor_id where possible
UPDATE notifications n
SET actor_id = f.follower_id
FROM user_followers f
WHERE n.type = 'follow' 
  AND n.user_id = f.user_id 
  AND n.actor_id IS NULL;

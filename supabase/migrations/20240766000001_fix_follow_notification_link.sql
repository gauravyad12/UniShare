-- Update the notify_on_follow function to use the correct link format
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  -- Get follower's username
  DECLARE follower_username TEXT;
  BEGIN
    SELECT username INTO follower_username FROM user_profiles WHERE id = NEW.follower_id;
    
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      'New Follower',
      follower_username || ' started following you',
      'follow',
      '/u/' || follower_username
    );
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- No need to recreate the trigger as it already exists

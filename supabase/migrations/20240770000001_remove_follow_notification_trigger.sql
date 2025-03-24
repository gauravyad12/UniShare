-- Remove the problematic follow notification trigger
DROP TRIGGER IF EXISTS new_follower_trigger ON user_followers;
DROP TRIGGER IF EXISTS on_new_follow ON user_followers;

-- Drop the function as well to clean up
DROP FUNCTION IF EXISTS notify_on_follow();
DROP FUNCTION IF EXISTS handle_new_follow();

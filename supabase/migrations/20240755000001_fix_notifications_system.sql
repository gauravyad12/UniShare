-- Ensure the notifications table exists and has the correct structure
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Force RLS on the notifications table
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow service role to insert notifications" ON notifications;

-- Create policies for notifications table
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Allow service role to insert notifications"
ON notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create or replace the insert_notification function
CREATE OR REPLACE FUNCTION insert_notification(notification JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  INSERT INTO notifications
  SELECT * FROM jsonb_populate_record(null::notifications, notification)
  RETURNING to_jsonb(notifications.*) INTO result;
  
  RETURN result;
END;
$$;

-- Ensure user_followers table exists with correct structure
CREATE TABLE IF NOT EXISTS user_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  follower_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, follower_id)
);

-- Force RLS on user_followers table
ALTER TABLE user_followers FORCE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view followers" ON user_followers;
DROP POLICY IF EXISTS "Users can follow others" ON user_followers;
DROP POLICY IF EXISTS "Users can unfollow" ON user_followers;

-- Create policies for user_followers table
CREATE POLICY "Users can view followers"
ON user_followers
FOR SELECT
USING (true);

CREATE POLICY "Users can follow others"
ON user_followers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON user_followers
FOR DELETE
USING (auth.uid() = follower_id);

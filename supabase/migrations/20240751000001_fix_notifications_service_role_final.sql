-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can manage all notifications" ON notifications;

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for service role to have full access to notifications
CREATE POLICY "Service role can manage all notifications"
ON notifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant permissions to service_role
GRANT ALL ON notifications TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Ensure the notifications table is in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Fix RLS policies for notifications table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can manage all notifications" ON notifications;

-- Enable RLS on notifications table if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for service role to manage all notifications
CREATE POLICY "Service role can manage all notifications"
ON notifications FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Notifications table is already in realtime publication
-- No need to add it again

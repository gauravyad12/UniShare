-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

-- Create a new policy that allows the service role to insert notifications
CREATE POLICY "Service role can insert notifications"
ON notifications
FOR INSERT
TO service_role
USING (true);

-- Ensure RLS is enabled on the notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Grant all privileges on notifications to the service role
GRANT ALL ON notifications TO service_role;

-- Ensure the table is in the realtime publication
alter publication supabase_realtime add table notifications;
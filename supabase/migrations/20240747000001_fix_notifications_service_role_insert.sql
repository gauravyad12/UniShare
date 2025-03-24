-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

-- Create a policy that allows the service role to insert into the notifications table
CREATE POLICY "Service role can insert notifications"
ON notifications
FOR INSERT
TO service_role
USING (true);

-- Enable realtime for notifications table
alter publication supabase_realtime add table notifications;

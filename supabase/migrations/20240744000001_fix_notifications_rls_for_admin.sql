-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admin to insert notifications" ON notifications;

-- Create a policy that allows the service role to insert notifications
CREATE POLICY "Allow admin to insert notifications"
ON notifications
FOR INSERT
TO authenticated
USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');

-- Make sure the notifications table has realtime enabled
alter publication supabase_realtime add table notifications;

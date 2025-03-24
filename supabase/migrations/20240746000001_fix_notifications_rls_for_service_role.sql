-- Remove the line that's causing the error (relation already exists in publication)
-- Instead, focus only on the RLS policy

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow service role to insert notifications" ON notifications;

-- Create policy to allow service role to insert notifications
CREATE POLICY "Allow service role to insert notifications"
ON notifications FOR INSERT
TO service_role
USING (true);

-- Ensure service role has all permissions on notifications table
GRANT ALL ON notifications TO service_role;
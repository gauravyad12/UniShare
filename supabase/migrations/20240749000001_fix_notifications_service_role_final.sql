-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can do all operations" ON notifications;

-- Create a new policy that allows service_role to do all operations
CREATE POLICY "Service role can do all operations"
ON notifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Grant all privileges to service_role
GRANT ALL ON notifications TO service_role;

-- Make sure the table is in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

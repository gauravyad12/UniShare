-- First, ensure the notifications table exists (this is a safety check)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    RAISE NOTICE 'Table notifications does not exist, skipping migration';
    RETURN;
  END IF;
END $$;

-- Drop existing policies on the notifications table
DROP POLICY IF EXISTS "Service role can do all operations" ON notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON notifications;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON notifications;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON notifications;

-- Ensure RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies

-- 1. Service role can do everything (most important)
CREATE POLICY "Service role can do all operations"
ON notifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Users can read their own notifications
CREATE POLICY "Users can read their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Users can insert notifications (though typically done by service role)
CREATE POLICY "Users can insert notifications"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR auth.uid() = actor_id);

-- Grant all privileges to service_role
GRANT ALL ON notifications TO service_role;

-- Make sure the table is in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

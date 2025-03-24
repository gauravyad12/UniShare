-- Fix notifications table schema and RLS policies

-- First check if the notifications table exists and add any missing columns
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    -- Add any missing columns if they don't exist
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns 
                    WHERE table_name = 'notifications' AND column_name = 'actor_id') THEN
        ALTER TABLE notifications ADD COLUMN actor_id UUID REFERENCES auth.users(id);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding actor_id column: %', SQLERRM;
    END;
    
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns 
                    WHERE table_name = 'notifications' AND column_name = 'related_id') THEN
        ALTER TABLE notifications ADD COLUMN related_id UUID;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding related_id column: %', SQLERRM;
    END;
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can manage all notifications" ON notifications;
DROP POLICY IF EXISTS "Allow admin to insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Disable RLS temporarily to ensure we can fix it properly
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for users to update their own notifications
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy for authenticated users to insert notifications
CREATE POLICY "Authenticated users can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy for service role to manage all notifications
CREATE POLICY "Service role can manage all notifications"
ON notifications FOR ALL
TO service_role
USING (true);

-- Ensure the table is in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

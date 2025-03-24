-- Fix notifications table schema to ensure it has all required fields

-- First check if the notifications table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    -- Add any missing columns if they don't exist
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns 
                    WHERE table_name = 'notifications' AND column_name = 'title') THEN
        ALTER TABLE notifications ADD COLUMN title TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding title column: %', SQLERRM;
    END;
    
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns 
                    WHERE table_name = 'notifications' AND column_name = 'message') THEN
        ALTER TABLE notifications ADD COLUMN message TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding message column: %', SQLERRM;
    END;
    
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns 
                    WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE notifications ADD COLUMN type TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding type column: %', SQLERRM;
    END;
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can manage all notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can manage all notifications" ON notifications;

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for users to update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy for service role to manage all notifications
CREATE POLICY "Service role can manage all notifications"
ON notifications FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Ensure the table is in the realtime publication (if not already)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables 
                  WHERE pubname = 'supabase_realtime' 
                  AND schemaname = 'public' 
                  AND tablename = 'notifications') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error adding table to publication: %', SQLERRM;
END $$;

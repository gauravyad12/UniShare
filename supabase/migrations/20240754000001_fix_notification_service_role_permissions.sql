-- Ensure the service role can bypass RLS for notifications table
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow service role to insert notifications" ON notifications;

-- Create policy to allow service role to insert notifications
CREATE POLICY "Allow service role to insert notifications"
ON notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create or replace the insert_notification function
CREATE OR REPLACE FUNCTION insert_notification(notification JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  INSERT INTO notifications
  SELECT * FROM jsonb_populate_record(null::notifications, notification)
  RETURNING to_jsonb(notifications.*) INTO result;
  
  RETURN result;
END;
$$;

-- Note: We're not adding the table to supabase_realtime again as it's likely already there
-- and attempting to add it again could cause the error
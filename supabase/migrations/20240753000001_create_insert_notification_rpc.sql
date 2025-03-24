-- Create a stored procedure that can be called via RPC to insert notifications
-- This function will use service role permissions to bypass RLS

CREATE OR REPLACE FUNCTION insert_notification(notification JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_row JSONB;
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    created_at,
    actor_id,
    related_id
  )
  VALUES (
    (notification->>'user_id')::uuid,
    notification->>'title',
    notification->>'message',
    notification->>'type',
    (notification->>'is_read')::boolean,
    COALESCE((notification->>'created_at')::timestamp with time zone, now()),
    (notification->>'actor_id')::uuid,
    (notification->>'related_id')::uuid
  )
  RETURNING to_jsonb(notifications.*) INTO inserted_row;
  
  RETURN inserted_row;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_notification TO authenticated;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION insert_notification TO service_role;

-- Add the notifications table to the realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END
$$;

-- Create a stored procedure that can be called to insert notifications
-- This provides an alternative method for inserting notifications
CREATE OR REPLACE FUNCTION insert_notification(notification jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  inserted_id uuid;
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
    COALESCE((notification->>'created_at')::timestamp, now()),
    (notification->>'actor_id')::uuid,
    (notification->>'related_id')::uuid
  )
  RETURNING id INTO inserted_id;
  
  SELECT jsonb_build_object('id', id) INTO result
  FROM notifications
  WHERE id = inserted_id;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users and service_role
GRANT EXECUTE ON FUNCTION insert_notification TO authenticated;
GRANT EXECUTE ON FUNCTION insert_notification TO service_role;

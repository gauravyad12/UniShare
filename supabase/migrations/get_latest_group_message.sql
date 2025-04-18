-- Migration to create a stored procedure for getting the latest message for a group
-- This procedure bypasses RLS policies and gets the latest message for a study group

-- Drop the function if it exists
DROP FUNCTION IF EXISTS get_latest_group_message(UUID);

-- Create the function with SECURITY DEFINER to bypass RLS
CREATE FUNCTION get_latest_group_message(
  p_group_id UUID
)
RETURNS TABLE(
  id UUID,
  study_group_id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return the latest message
  RETURN QUERY
  SELECT
    m.id,
    m.study_group_id,
    m.sender_id,
    m.content,
    m.created_at
  FROM group_chat_messages m
  WHERE m.study_group_id = p_group_id
  ORDER BY m.created_at DESC
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_latest_group_message(UUID) TO authenticated;

-- Comment explaining the function
COMMENT ON FUNCTION get_latest_group_message(UUID) IS
'Gets the latest message for a study group, bypassing RLS policies.';

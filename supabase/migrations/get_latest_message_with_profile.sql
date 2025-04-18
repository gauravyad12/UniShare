-- Migration to create a function to get the latest message with profile information

-- Drop the function if it exists
DROP FUNCTION IF EXISTS get_latest_message_with_profile(UUID);

-- Create the function
CREATE FUNCTION get_latest_message_with_profile(
  p_group_id UUID
)
RETURNS TABLE(
  id UUID,
  study_group_id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return the latest message with profile information
  RETURN QUERY
  SELECT 
    m.id,
    m.study_group_id,
    m.sender_id,
    m.content,
    m.created_at,
    p.full_name,
    p.username,
    p.avatar_url
  FROM group_chat_messages m
  LEFT JOIN user_profiles p ON m.sender_id = p.id
  WHERE m.study_group_id = p_group_id
  ORDER BY m.created_at DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_latest_message_with_profile(UUID) TO authenticated;

COMMENT ON FUNCTION get_latest_message_with_profile(UUID) IS 
'Gets the latest message for a study group with profile information, bypassing RLS policies.';

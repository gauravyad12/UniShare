-- Migration to create a fixed stored procedure for getting group chat messages
-- This procedure bypasses RLS policies and gets messages for a study group

-- Drop the function if it exists
DROP FUNCTION IF EXISTS get_group_chat_messages(UUID, UUID, INT, TIMESTAMPTZ, TIMESTAMPTZ);

-- Create the function with SECURITY DEFINER to bypass RLS
CREATE FUNCTION get_group_chat_messages(
  p_group_id UUID,
  p_user_id UUID,
  p_limit INT DEFAULT 50,
  p_before TIMESTAMPTZ DEFAULT NULL,
  p_after TIMESTAMPTZ DEFAULT NULL
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
DECLARE
  v_is_member BOOLEAN;
BEGIN
  -- Check if the user is a member of the study group
  SELECT EXISTS (
    SELECT 1 FROM study_group_members
    WHERE study_group_id = p_group_id AND user_id = p_user_id
  ) INTO v_is_member;

  -- If not a member, check if the user is in the user's study groups
  IF NOT v_is_member THEN
    SELECT EXISTS (
      SELECT 1 FROM get_user_study_groups(p_user_id)
      WHERE id = p_group_id
    ) INTO v_is_member;
  END IF;

  -- If still not a member, return empty result
  IF NOT v_is_member THEN
    RETURN;
  END IF;

  -- Return messages with profile information
  RETURN QUERY
  WITH messages AS (
    SELECT m.*
    FROM group_chat_messages m
    WHERE m.study_group_id = p_group_id
    AND (
      (p_before IS NULL AND p_after IS NULL) OR
      (p_before IS NOT NULL AND m.created_at < p_before) OR
      (p_after IS NOT NULL AND m.created_at > p_after)
    )
    ORDER BY
      CASE WHEN p_after IS NOT NULL THEN m.created_at END ASC,
      CASE WHEN p_after IS NULL THEN m.created_at END DESC
    LIMIT p_limit
  )
  SELECT
    m.id,
    m.study_group_id,
    m.sender_id,
    m.content,
    m.created_at,
    p.full_name,
    p.username,
    p.avatar_url
  FROM messages m
  LEFT JOIN user_profiles p ON m.sender_id = p.id
  ORDER BY
    CASE WHEN p_after IS NOT NULL THEN m.created_at END ASC,
    CASE WHEN p_after IS NULL THEN m.created_at END DESC;

  -- Mark messages as read
  INSERT INTO message_read_status (message_id, user_id, read_at)
  SELECT m.id, p_user_id, NOW()
  FROM group_chat_messages m
  WHERE m.study_group_id = p_group_id
  AND NOT EXISTS (
    SELECT 1 FROM message_read_status
    WHERE message_id = m.id AND user_id = p_user_id
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_group_chat_messages(UUID, UUID, INT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- Comment explaining the function
COMMENT ON FUNCTION get_group_chat_messages(UUID, UUID, INT, TIMESTAMPTZ, TIMESTAMPTZ) IS
'Gets messages for a study group with profile information, bypassing RLS policies.
Only returns messages if the user is a member of the study group.
Also marks messages as read.';

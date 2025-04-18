-- Migration to create the message_read_status table and fix the get_group_chat_messages function

-- Create the message_read_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS message_read_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES group_chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Add comment to the table
COMMENT ON TABLE message_read_status IS 'Tracks which messages have been read by which users';

-- Add RLS policies to the table
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;

-- Users can see their own read status
CREATE POLICY "Users can view their own read status" 
ON message_read_status 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own read status
CREATE POLICY "Users can insert their own read status" 
ON message_read_status 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Fix the get_group_chat_messages function to handle the case when the table doesn't exist
DROP FUNCTION IF EXISTS get_group_chat_messages(UUID, UUID, INT, TIMESTAMPTZ, TIMESTAMPTZ);

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
  v_table_exists BOOLEAN;
BEGIN
  -- Check if the user is a member of the study group
  SELECT EXISTS (
    SELECT 1 FROM study_group_members sgm
    WHERE sgm.study_group_id = p_group_id AND sgm.user_id = p_user_id
  ) INTO v_is_member;
  
  -- If not a member, check if the user is in the user's study groups
  IF NOT v_is_member THEN
    SELECT EXISTS (
      SELECT 1 FROM get_user_study_groups(p_user_id) g
      WHERE g.id = p_group_id
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
  
  -- Check if the message_read_status table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'message_read_status'
  ) INTO v_table_exists;
  
  -- Only try to mark messages as read if the table exists
  IF v_table_exists THEN
    -- Mark messages as read
    INSERT INTO message_read_status (message_id, user_id, read_at)
    SELECT m.id, p_user_id, NOW()
    FROM group_chat_messages m
    WHERE m.study_group_id = p_group_id
    AND NOT EXISTS (
      SELECT 1 FROM message_read_status mrs
      WHERE mrs.message_id = m.id AND mrs.user_id = p_user_id
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_group_chat_messages(UUID, UUID, INT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

COMMENT ON FUNCTION get_group_chat_messages(UUID, UUID, INT, TIMESTAMPTZ, TIMESTAMPTZ) IS 
'Gets messages for a study group with profile information, bypassing RLS policies.
Only returns messages if the user is a member of the study group.
Also marks messages as read if the message_read_status table exists.';

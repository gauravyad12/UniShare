-- Migration to fix the send_group_chat_message function to handle the case when the message_read_status table doesn't exist

-- Drop the function if it exists
DROP FUNCTION IF EXISTS send_group_chat_message(UUID, UUID, TEXT);

-- Create the function with SECURITY DEFINER to bypass RLS
CREATE FUNCTION send_group_chat_message(
  p_group_id UUID, 
  p_user_id UUID,
  p_content TEXT
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
  v_message_id UUID;
  v_created_at TIMESTAMPTZ;
  v_table_exists BOOLEAN;
BEGIN
  -- Check if the user is a member of the study group
  SELECT EXISTS (
    SELECT 1 FROM study_group_members sgm
    WHERE sgm.study_group_id = p_group_id AND sgm.user_id = p_user_id
  ) INTO v_is_member;
  
  -- If not a member, raise an exception
  IF NOT v_is_member THEN
    RAISE EXCEPTION 'User is not a member of this study group';
  END IF;
  
  -- Insert the message
  INSERT INTO group_chat_messages (study_group_id, sender_id, content, created_at)
  VALUES (p_group_id, p_user_id, p_content, NOW())
  RETURNING id, created_at INTO v_message_id, v_created_at;
  
  -- Update the last_message_at and message_count in the study group
  UPDATE study_groups
  SET 
    last_message_at = v_created_at,
    message_count = COALESCE(message_count, 0) + 1
  WHERE id = p_group_id;
  
  -- Return the message with profile information
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
  WHERE m.id = v_message_id;
  
  -- Check if the message_read_status table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'message_read_status'
  ) INTO v_table_exists;
  
  -- Only try to mark the message as read if the table exists
  IF v_table_exists THEN
    -- Mark the message as read by the sender
    INSERT INTO message_read_status (message_id, user_id, read_at)
    VALUES (v_message_id, p_user_id, NOW());
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION send_group_chat_message(UUID, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION send_group_chat_message(UUID, UUID, TEXT) IS 
'Sends a message to a study group, bypassing RLS policies.
Only allows sending if the user is a member of the study group.
Returns the message with profile information.
Also marks the message as read by the sender if the message_read_status table exists.';

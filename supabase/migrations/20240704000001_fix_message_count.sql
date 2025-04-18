-- Migration to fix the message count in study groups

-- First, update all study groups to have the correct message count
UPDATE study_groups sg
SET message_count = (
  SELECT COUNT(*)
  FROM group_chat_messages gcm
  WHERE gcm.study_group_id = sg.id
);

-- Then fix the send_group_chat_message function to avoid double counting
CREATE OR REPLACE FUNCTION public.send_group_chat_message(p_group_id UUID, p_user_id UUID, p_content TEXT)
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
SET search_path = public
AS $$
DECLARE
  v_is_member BOOLEAN;
  v_message_id UUID;
  v_created_at TIMESTAMPTZ;
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
  RETURNING group_chat_messages.id, group_chat_messages.created_at INTO v_message_id, v_created_at;
  
  -- Update the last_message_at and message_count in the study group
  -- First get the current accurate count
  UPDATE study_groups sg
  SET 
    last_message_at = v_created_at,
    message_count = (
      SELECT COUNT(*)
      FROM group_chat_messages gcm
      WHERE gcm.study_group_id = p_group_id
    )
  WHERE sg.id = p_group_id;
  
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
  
  -- Mark the message as read by the sender
  INSERT INTO message_read_status (message_id, user_id, read_at)
  VALUES (v_message_id, p_user_id, NOW());
END;
$$;

GRANT EXECUTE ON FUNCTION send_group_chat_message(UUID, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION send_group_chat_message(UUID, UUID, TEXT) IS 
'Sends a message to a study group, bypassing RLS policies.
Only allows sending if the user is a member of the study group.
Updates the message count based on the actual count of messages.
Returns the message with profile information.';

-- Also fix the send_message_with_profile function
CREATE OR REPLACE FUNCTION public.send_message_with_profile(p_group_id UUID, p_user_id UUID, p_content TEXT)
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
SET search_path = public
AS $$
DECLARE
  v_is_member BOOLEAN;
  v_message_id UUID;
  v_created_at TIMESTAMPTZ;
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
  RETURNING group_chat_messages.id, group_chat_messages.created_at INTO v_message_id, v_created_at;
  
  -- Update the last_message_at and message_count in the study group
  -- First get the current accurate count
  UPDATE study_groups sg
  SET 
    last_message_at = v_created_at,
    message_count = (
      SELECT COUNT(*)
      FROM group_chat_messages gcm
      WHERE gcm.study_group_id = p_group_id
    )
  WHERE sg.id = p_group_id;
  
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
  
  -- Mark the message as read by the sender
  INSERT INTO message_read_status (message_id, user_id, read_at)
  VALUES (v_message_id, p_user_id, NOW());
END;
$$;

GRANT EXECUTE ON FUNCTION send_message_with_profile(UUID, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION send_message_with_profile(UUID, UUID, TEXT) IS 
'Sends a message to a study group, bypassing RLS policies.
Only allows sending if the user is a member of the study group.
Updates the message count based on the actual count of messages.
Returns the message with profile information.';

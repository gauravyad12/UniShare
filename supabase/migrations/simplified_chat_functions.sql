-- Migration to create simplified chat functions

-- Drop existing functions to clean up
DROP FUNCTION IF EXISTS send_group_chat_message(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS send_group_chat_message_simple(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS get_group_chat_messages(UUID, UUID, INT, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS get_latest_group_message(UUID);

-- Create a simplified function to get messages with profile information
CREATE FUNCTION get_messages_with_profiles(
  p_group_id UUID, 
  p_user_id UUID,
  p_limit INT DEFAULT 100
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
  ORDER BY m.created_at ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_messages_with_profiles(UUID, UUID, INT) TO authenticated;

COMMENT ON FUNCTION get_messages_with_profiles(UUID, UUID, INT) IS 
'Gets messages for a study group with profile information, bypassing RLS policies.
Only returns messages if the user is a member of the study group.';

-- Create a simplified function to send a message and return it with profile information
CREATE FUNCTION send_message_with_profile(
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
  UPDATE study_groups sg
  SET 
    last_message_at = v_created_at,
    message_count = COALESCE(sg.message_count, 0) + 1
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
END;
$$;

GRANT EXECUTE ON FUNCTION send_message_with_profile(UUID, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION send_message_with_profile(UUID, UUID, TEXT) IS 
'Sends a message to a study group and returns it with profile information, bypassing RLS policies.
Only allows sending if the user is a member of the study group.';

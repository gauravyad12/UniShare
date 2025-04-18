-- Migration to create a simpler version of the send_group_chat_message function

-- Drop the function if it exists
DROP FUNCTION IF EXISTS send_group_chat_message_simple(UUID, UUID, TEXT);

-- Create a simpler function that just returns the message ID
CREATE FUNCTION send_group_chat_message_simple(
  p_group_id UUID, 
  p_user_id UUID,
  p_content TEXT
)
RETURNS UUID
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
  
  -- Return just the message ID
  RETURN v_message_id;
END;
$$;

GRANT EXECUTE ON FUNCTION send_group_chat_message_simple(UUID, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION send_group_chat_message_simple(UUID, UUID, TEXT) IS 
'Simpler version of send_group_chat_message that just returns the message ID.
Only allows sending if the user is a member of the study group.';

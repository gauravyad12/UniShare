-- Comprehensive migration file that contains all the SQL statements

-- First, update the study_groups table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'study_groups' AND column_name = 'message_count'
    ) THEN
        ALTER TABLE study_groups ADD COLUMN message_count INT DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'study_groups' AND column_name = 'last_message_at'
    ) THEN
        ALTER TABLE study_groups ADD COLUMN last_message_at TIMESTAMPTZ;
    END IF;
END $$;

COMMENT ON COLUMN study_groups.message_count IS 'Number of messages in the study group chat';
COMMENT ON COLUMN study_groups.last_message_at IS 'Timestamp of the last message in the study group chat';

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS check_study_group_membership(UUID, UUID);
DROP FUNCTION IF EXISTS leave_study_group(UUID, UUID);
DROP FUNCTION IF EXISTS get_group_chat_messages(UUID, UUID, INT, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS send_group_chat_message(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS manage_study_group_member(UUID, UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_latest_group_message(UUID);
DROP FUNCTION IF EXISTS join_study_group_direct(UUID, UUID);

-- Create check_study_group_membership function
CREATE FUNCTION check_study_group_membership(p_group_id UUID, p_user_id UUID)
RETURNS TABLE(is_member BOOLEAN, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as is_member,
    sgm.role
  FROM 
    study_group_members sgm
  WHERE 
    sgm.study_group_id = p_group_id
    AND sgm.user_id = p_user_id;
    
  -- If no rows are returned, the user is not a member
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE as is_member, NULL::TEXT as role;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION check_study_group_membership(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION check_study_group_membership(UUID, UUID) IS 
'Checks if a user is a member of a study group, bypassing RLS policies. 
Returns a table with is_member (boolean) and role (text) columns.';

-- Create leave_study_group function
CREATE FUNCTION leave_study_group(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_created_by UUID;
  v_member_count INT;
  v_rows_deleted INT;
BEGIN
  -- Get the creator ID and member count
  SELECT created_by, member_count INTO v_created_by, v_member_count
  FROM study_groups
  WHERE id = p_group_id;
  
  -- Don't allow the creator to leave
  IF v_created_by = p_user_id THEN
    RAISE EXCEPTION 'The creator cannot leave the group';
  END IF;
  
  -- Delete the membership
  WITH deleted AS (
    DELETE FROM study_group_members
    WHERE study_group_id = p_group_id AND user_id = p_user_id
    RETURNING *
  )
  SELECT COUNT(*) INTO v_rows_deleted FROM deleted;
  
  -- If no rows were deleted, the user wasn't a member
  IF v_rows_deleted = 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Update the member count
  UPDATE study_groups
  SET member_count = GREATEST((v_member_count - 1), 0)
  WHERE id = p_group_id;
  
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION leave_study_group(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION leave_study_group(UUID, UUID) IS 
'Allows a user to leave a study group, bypassing RLS policies. 
Returns TRUE if successful, FALSE if the user was not a member.
Raises an exception if the user is the creator of the group.';

-- Create get_group_chat_messages function
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

GRANT EXECUTE ON FUNCTION get_group_chat_messages(UUID, UUID, INT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

COMMENT ON FUNCTION get_group_chat_messages(UUID, UUID, INT, TIMESTAMPTZ, TIMESTAMPTZ) IS 
'Gets messages for a study group with profile information, bypassing RLS policies.
Only returns messages if the user is a member of the study group.
Also marks messages as read.';

-- Create send_group_chat_message function
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
BEGIN
  -- Check if the user is a member of the study group
  SELECT EXISTS (
    SELECT 1 FROM study_group_members
    WHERE study_group_id = p_group_id AND user_id = p_user_id
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
  
  -- Mark the message as read by the sender
  INSERT INTO message_read_status (message_id, user_id, read_at)
  VALUES (v_message_id, p_user_id, NOW());
END;
$$;

GRANT EXECUTE ON FUNCTION send_group_chat_message(UUID, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION send_group_chat_message(UUID, UUID, TEXT) IS 
'Sends a message to a study group, bypassing RLS policies.
Only allows sending if the user is a member of the study group.
Returns the message with profile information.';

-- Create manage_study_group_member function
CREATE FUNCTION manage_study_group_member(
  p_group_id UUID, 
  p_admin_id UUID,
  p_target_user_id UUID,
  p_action TEXT,
  p_new_role TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_created_by UUID;
  v_admin_role TEXT;
  v_target_role TEXT;
  v_member_count INT;
  v_rows_affected INT;
BEGIN
  -- Get the creator ID and member count
  SELECT created_by, member_count INTO v_created_by, v_member_count
  FROM study_groups
  WHERE id = p_group_id;
  
  -- If study group not found
  IF v_created_by IS NULL THEN
    RAISE EXCEPTION 'Study group not found';
  END IF;
  
  -- Check if admin is the creator
  IF v_created_by = p_admin_id THEN
    v_admin_role := 'creator';
  ELSE
    -- Get admin's role
    SELECT role INTO v_admin_role
    FROM study_group_members
    WHERE study_group_id = p_group_id AND user_id = p_admin_id;
    
    -- If admin is not a member
    IF v_admin_role IS NULL THEN
      RAISE EXCEPTION 'You are not a member of this study group';
    END IF;
  END IF;
  
  -- Get target user's role
  SELECT role INTO v_target_role
  FROM study_group_members
  WHERE study_group_id = p_group_id AND user_id = p_target_user_id;
  
  -- If target user is not a member
  IF v_target_role IS NULL AND p_action != 'add' THEN
    RAISE EXCEPTION 'Target user is not a member of this study group';
  END IF;
  
  -- Don't allow removing the creator
  IF p_target_user_id = v_created_by AND p_action = 'remove' THEN
    RAISE EXCEPTION 'Cannot remove the creator of the study group';
  END IF;
  
  -- Check permissions based on action
  IF p_action = 'update_role' THEN
    -- Only creator or admins can update roles
    IF v_admin_role != 'admin' AND v_created_by != p_admin_id THEN
      RAISE EXCEPTION 'Only the creator or admins can update member roles';
    END IF;
    
    -- Update the member's role
    UPDATE study_group_members
    SET role = p_new_role
    WHERE study_group_id = p_group_id AND user_id = p_target_user_id
    RETURNING 1 INTO v_rows_affected;
    
    RETURN v_rows_affected > 0;
    
  ELSIF p_action = 'remove' THEN
    -- Check if admin has permission to remove this member
    IF v_created_by != p_admin_id AND v_admin_role != 'admin' AND p_admin_id != p_target_user_id THEN
      RAISE EXCEPTION 'Only the creator, admins, or the member themselves can remove a member';
    END IF;
    
    -- Remove the member
    DELETE FROM study_group_members
    WHERE study_group_id = p_group_id AND user_id = p_target_user_id
    RETURNING 1 INTO v_rows_affected;
    
    -- If successfully removed
    IF v_rows_affected > 0 THEN
      -- Update member count
      UPDATE study_groups
      SET member_count = GREATEST((v_member_count - 1), 0)
      WHERE id = p_group_id;
      
      RETURN TRUE;
    END IF;
    
    RETURN FALSE;
    
  ELSIF p_action = 'add' THEN
    -- Only creator or admins can add members
    IF v_admin_role != 'admin' AND v_created_by != p_admin_id THEN
      RAISE EXCEPTION 'Only the creator or admins can add members';
    END IF;
    
    -- Check if user is already a member
    IF v_target_role IS NOT NULL THEN
      RAISE EXCEPTION 'User is already a member of this study group';
    END IF;
    
    -- Add the member
    INSERT INTO study_group_members (study_group_id, user_id, role, joined_at)
    VALUES (p_group_id, p_target_user_id, COALESCE(p_new_role, 'member'), NOW())
    RETURNING 1 INTO v_rows_affected;
    
    -- If successfully added
    IF v_rows_affected > 0 THEN
      -- Update member count
      UPDATE study_groups
      SET member_count = (v_member_count + 1)
      WHERE id = p_group_id;
      
      RETURN TRUE;
    END IF;
    
    RETURN FALSE;
  ELSE
    RAISE EXCEPTION 'Invalid action. Must be "update_role", "remove", or "add"';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION manage_study_group_member(UUID, UUID, UUID, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION manage_study_group_member(UUID, UUID, UUID, TEXT, TEXT) IS 
'Manages study group members, bypassing RLS policies.
Actions: "update_role", "remove", "add"
Returns TRUE if successful, FALSE if not.
Raises exceptions for permission issues or invalid actions.';

-- Create get_latest_group_message function
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

GRANT EXECUTE ON FUNCTION get_latest_group_message(UUID) TO authenticated;

COMMENT ON FUNCTION get_latest_group_message(UUID) IS 
'Gets the latest message for a study group, bypassing RLS policies.';

-- Create join_study_group_direct function
CREATE FUNCTION join_study_group_direct(
  group_id UUID, 
  user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_member BOOLEAN;
  v_member_count INT;
  v_max_members INT;
BEGIN
  -- Check if the user is already a member
  SELECT EXISTS (
    SELECT 1 FROM study_group_members
    WHERE study_group_id = group_id AND user_id = user_id
  ) INTO v_is_member;
  
  -- If already a member, return false
  IF v_is_member THEN
    RETURN FALSE;
  END IF;
  
  -- Get the current member count and max members
  SELECT member_count, max_members INTO v_member_count, v_max_members
  FROM study_groups
  WHERE id = group_id;
  
  -- Check if the group is full
  IF v_member_count >= v_max_members THEN
    RAISE EXCEPTION 'This study group is full';
  END IF;
  
  -- Add the user to the group
  INSERT INTO study_group_members (study_group_id, user_id, role, joined_at)
  VALUES (group_id, user_id, 'member', NOW());
  
  -- Update the member count
  UPDATE study_groups
  SET member_count = COALESCE(member_count, 0) + 1
  WHERE id = group_id;
  
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION join_study_group_direct(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION join_study_group_direct(UUID, UUID) IS 
'Allows a user to join a study group directly, bypassing RLS policies.
Returns TRUE if successful, FALSE if the user is already a member.
Raises an exception if the group is full.';

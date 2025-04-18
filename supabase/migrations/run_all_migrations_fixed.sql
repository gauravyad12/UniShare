-- Migration to run all the SQL migrations in the correct order

-- First, update the study_groups table
\i update_study_groups_table.sql

-- Then create the stored procedures
\i check_study_group_membership.sql
\i leave_study_group.sql
\i get_group_chat_messages_fixed.sql
\i send_group_chat_message.sql
\i manage_study_group_member.sql
\i get_latest_group_message.sql

-- Create a join_study_group_direct function
DROP FUNCTION IF EXISTS join_study_group_direct(UUID, UUID);

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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION join_study_group_direct(UUID, UUID) TO authenticated;

-- Comment explaining the function
COMMENT ON FUNCTION join_study_group_direct(UUID, UUID) IS
'Allows a user to join a study group directly, bypassing RLS policies.
Returns TRUE if successful, FALSE if the user is already a member.
Raises an exception if the group is full.';

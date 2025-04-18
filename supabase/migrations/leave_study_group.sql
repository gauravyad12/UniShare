-- Migration to create a stored procedure for leaving a study group
-- This procedure bypasses RLS policies and allows a user to leave a study group

-- Drop the function if it exists
DROP FUNCTION IF EXISTS leave_study_group(UUID, UUID);

-- Create the function with SECURITY DEFINER to bypass RLS
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION leave_study_group(UUID, UUID) TO authenticated;

-- Comment explaining the function
COMMENT ON FUNCTION leave_study_group(UUID, UUID) IS
'Allows a user to leave a study group, bypassing RLS policies.
Returns TRUE if successful, FALSE if the user was not a member.
Raises an exception if the user is the creator of the group.';

-- Migration to create a stored procedure for managing study group members
-- This procedure bypasses RLS policies and allows admins to manage members

-- Drop the function if it exists
DROP FUNCTION IF EXISTS manage_study_group_member(UUID, UUID, UUID, TEXT, TEXT);

-- Create the function with SECURITY DEFINER to bypass RLS
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION manage_study_group_member(UUID, UUID, UUID, TEXT, TEXT) TO authenticated;

-- Comment explaining the function
COMMENT ON FUNCTION manage_study_group_member(UUID, UUID, UUID, TEXT, TEXT) IS
'Manages study group members, bypassing RLS policies.
Actions: "update_role", "remove", "add"
Returns TRUE if successful, FALSE if not.
Raises exceptions for permission issues or invalid actions.';

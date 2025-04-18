-- Migration to create a stored procedure for checking study group membership
-- This procedure bypasses RLS policies and checks if a user is a member of a study group

-- Drop the function if it exists
DROP FUNCTION IF EXISTS check_study_group_membership(UUID, UUID);

-- Create the function with SECURITY DEFINER to bypass RLS
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_study_group_membership(UUID, UUID) TO authenticated;

-- Comment explaining the function
COMMENT ON FUNCTION check_study_group_membership(UUID, UUID) IS
'Checks if a user is a member of a study group, bypassing RLS policies.
Returns a table with is_member (boolean) and role (text) columns.';

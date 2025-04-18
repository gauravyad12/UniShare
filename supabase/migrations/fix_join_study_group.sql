-- Migration to fix the join_study_group_direct function

-- Drop the function if it exists
DROP FUNCTION IF EXISTS join_study_group_direct(UUID, UUID);

-- Create the function with SECURITY DEFINER to bypass RLS
CREATE FUNCTION join_study_group_direct(
  p_group_id UUID, 
  p_user_id UUID
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
    SELECT 1 FROM study_group_members sgm
    WHERE sgm.study_group_id = p_group_id AND sgm.user_id = p_user_id
  ) INTO v_is_member;
  
  -- If already a member, return false
  IF v_is_member THEN
    RETURN FALSE;
  END IF;
  
  -- Get the current member count and max members
  SELECT member_count, max_members INTO v_member_count, v_max_members
  FROM study_groups
  WHERE id = p_group_id;
  
  -- Check if the group is full
  IF v_member_count >= v_max_members THEN
    RAISE EXCEPTION 'This study group is full';
  END IF;
  
  -- Add the user to the group
  INSERT INTO study_group_members (study_group_id, user_id, role, joined_at)
  VALUES (p_group_id, p_user_id, 'member', NOW());
  
  -- Update the member count
  UPDATE study_groups
  SET member_count = COALESCE(member_count, 0) + 1
  WHERE id = p_group_id;
  
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

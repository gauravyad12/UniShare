-- Migration to create a stored procedure for joining study groups
-- This procedure bypasses RLS policies and allows direct insertion into study_group_members

-- Create the function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION join_study_group_direct(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the group exists
  IF NOT EXISTS (SELECT 1 FROM study_groups WHERE id = p_group_id) THEN
    RAISE EXCEPTION 'Study group does not exist';
  END IF;
  
  -- Check if the user is already a member
  IF EXISTS (SELECT 1 FROM study_group_members WHERE study_group_id = p_group_id AND user_id = p_user_id) THEN
    RETURN FALSE; -- Already a member
  END IF;
  
  -- Add the user to the group
  INSERT INTO study_group_members (
    study_group_id,
    user_id,
    role,
    joined_at
  ) VALUES (
    p_group_id,
    p_user_id,
    'member',
    NOW()
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RETURN FALSE; -- Already a member (race condition)
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION join_study_group_direct(UUID, UUID) TO authenticated;

-- Comment explaining the function
COMMENT ON FUNCTION join_study_group_direct(UUID, UUID) IS 
'Allows users to join a study group directly, bypassing RLS policies. 
Returns TRUE if successful, FALSE if already a member.';

-- Migration to fix the member count in study groups

-- Update the member count for all study groups based on actual members
UPDATE study_groups sg
SET member_count = (
  SELECT COUNT(*)
  FROM study_group_members sgm
  WHERE sgm.study_group_id = sg.id
);

-- Fix the join_study_group_direct function to check actual member count
DROP FUNCTION IF EXISTS join_study_group_direct(UUID, UUID);

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
  v_actual_member_count INT;
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
  
  -- Get the actual member count and max members
  SELECT 
    (SELECT COUNT(*) FROM study_group_members WHERE study_group_id = p_group_id),
    max_members 
  INTO v_actual_member_count, v_max_members
  FROM study_groups
  WHERE id = p_group_id;
  
  -- Check if the group is full based on actual count
  IF v_actual_member_count >= v_max_members THEN
    RAISE EXCEPTION 'This study group is full';
  END IF;
  
  -- Add the user to the group
  INSERT INTO study_group_members (study_group_id, user_id, role, joined_at)
  VALUES (p_group_id, p_user_id, 'member', NOW());
  
  -- Update the member count to the actual count + 1
  UPDATE study_groups
  SET member_count = v_actual_member_count + 1
  WHERE id = p_group_id;
  
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION join_study_group_direct(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION join_study_group_direct(UUID, UUID) IS 
'Allows a user to join a study group directly, bypassing RLS policies.
Returns TRUE if successful, FALSE if the user is already a member.
Raises an exception if the group is full.
Uses actual member count from study_group_members table.';

-- Create a security definer function to safely delete a study group and all related data
CREATE OR REPLACE FUNCTION public.delete_study_group(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_creator BOOLEAN;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is the creator of the group
  SELECT EXISTS (
    SELECT 1 FROM study_groups
    WHERE id = p_group_id AND created_by = p_user_id
  ) INTO v_is_creator;
  
  -- If not creator, check if user is an admin
  IF NOT v_is_creator THEN
    SELECT EXISTS (
      SELECT 1 FROM study_group_members
      WHERE study_group_id = p_group_id 
      AND user_id = p_user_id
      AND role = 'admin'
    ) INTO v_is_admin;
    
    -- If neither creator nor admin, return false
    IF NOT v_is_admin THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Delete all related data
  -- 1. Delete typing status records
  DELETE FROM group_chat_typing_status
  WHERE study_group_id = p_group_id;
  
  -- 2. Delete all messages
  DELETE FROM group_chat_messages
  WHERE study_group_id = p_group_id;
  
  -- 3. Delete all resources
  DELETE FROM study_group_resources
  WHERE study_group_id = p_group_id;
  
  -- 4. Delete all members
  DELETE FROM study_group_members
  WHERE study_group_id = p_group_id;
  
  -- 5. Finally, delete the study group
  DELETE FROM study_groups
  WHERE id = p_group_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

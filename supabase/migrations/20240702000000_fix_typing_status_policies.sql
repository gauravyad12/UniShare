-- Drop the existing policies that are causing recursion
DROP POLICY IF EXISTS "Users can view typing status for groups they are members of" ON public.group_chat_typing_status;
DROP POLICY IF EXISTS "Users can insert their own typing status" ON public.group_chat_typing_status;

-- Create new policies that avoid recursion by using direct joins instead of EXISTS subqueries
CREATE POLICY "Users can view typing status for groups they are members of v2"
  ON public.group_chat_typing_status
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    study_group_id IN (
      SELECT study_group_id FROM public.study_group_members
      WHERE user_id = auth.uid()
    ) OR
    study_group_id IN (
      SELECT id FROM public.study_groups
      WHERE created_by = auth.uid()
    )
  );

-- Allow users to insert their own typing status
CREATE POLICY "Users can insert their own typing status v2"
  ON public.group_chat_typing_status
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    (
      study_group_id IN (
        SELECT study_group_id FROM public.study_group_members
        WHERE user_id = auth.uid()
      ) OR
      study_group_id IN (
        SELECT id FROM public.study_groups
        WHERE created_by = auth.uid()
      )
    )
  );

-- Create a security definer function to check membership without triggering RLS
CREATE OR REPLACE FUNCTION public.check_typing_status_membership(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is a member or creator
  RETURN EXISTS (
    SELECT 1 FROM study_group_members
    WHERE study_group_id = p_group_id AND user_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM study_groups
    WHERE id = p_group_id AND created_by = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

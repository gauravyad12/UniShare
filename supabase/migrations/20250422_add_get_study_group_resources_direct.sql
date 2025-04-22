-- Function to get study group resources directly, bypassing RLS
CREATE OR REPLACE FUNCTION public.get_study_group_resources_direct(p_group_id UUID)
RETURNS TABLE (
  id UUID,
  resource_id UUID,
  added_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function bypasses RLS by using SECURITY DEFINER
  RETURN QUERY
  SELECT
    sgr.id,
    sgr.resource_id,
    sgr.added_by
  FROM
    study_group_resources sgr
  WHERE
    sgr.study_group_id = p_group_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_study_group_resources_direct(UUID) TO authenticated;

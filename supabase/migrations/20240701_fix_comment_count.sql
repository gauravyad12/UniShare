-- Fix any existing incorrect comment counts in the resources table
DO $$
DECLARE
  resource_record RECORD;
BEGIN
  -- Loop through all resources
  FOR resource_record IN SELECT id FROM public.resources
  LOOP
    -- Update the comment_count to match the actual count of comments
    UPDATE public.resources
    SET comment_count = (
      SELECT COUNT(*) 
      FROM public.resource_comments 
      WHERE resource_id = resource_record.id
    )
    WHERE id = resource_record.id;
  END LOOP;
END
$$;
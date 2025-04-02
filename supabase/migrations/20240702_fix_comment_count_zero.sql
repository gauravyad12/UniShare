-- Fix any resources with zero comment counts by recounting
DO $$
DECLARE
  resource_record RECORD;
  comment_count INTEGER;
BEGIN
  -- Loop through all resources
  FOR resource_record IN SELECT id FROM public.resources
  LOOP
    -- Count comments for this resource
    SELECT COUNT(*) INTO comment_count
    FROM public.resource_comments
    WHERE resource_id = resource_record.id;
    
    -- Update the comment_count
    UPDATE public.resources
    SET comment_count = comment_count
    WHERE id = resource_record.id;
  END LOOP;
END
$$;
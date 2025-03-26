-- Rename external_url to external_link if needed
DO $$
BEGIN
  -- Check if external_url exists but external_link doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'resources' 
    AND column_name = 'external_url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'resources' 
    AND column_name = 'external_link'
  ) THEN
    -- Rename the column
    ALTER TABLE public.resources RENAME COLUMN external_url TO external_link;
  -- If external_link exists but external_url doesn't, no action needed
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'resources' 
    AND column_name = 'external_link'
  ) THEN
    -- Add external_link column if neither exists
    ALTER TABLE public.resources ADD COLUMN external_link TEXT;
  END IF;
END
$$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Ensure external_url column exists in resources table

-- First check if the column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'resources' 
    AND column_name = 'external_url'
  ) THEN
    ALTER TABLE public.resources ADD COLUMN external_url TEXT;
  END IF;
END
$$;

-- Refresh the schema cache to ensure the column is recognized
NOTIFY pgrst, 'reload schema';

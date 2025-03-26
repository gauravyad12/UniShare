-- Add likes and downloads columns to resources table if they don't exist
DO $$
BEGIN
    -- Check if likes column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'resources' AND column_name = 'likes') THEN
        ALTER TABLE resources ADD COLUMN likes integer DEFAULT 0;
    END IF;

    -- Check if downloads column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'resources' AND column_name = 'downloads') THEN
        ALTER TABLE resources ADD COLUMN downloads integer DEFAULT 0;
    END IF;

    -- Don't try to add the table to the publication if it's already there
    -- This was causing the error
END
$$;
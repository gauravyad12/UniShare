-- Add likes and downloads columns to resources table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'likes') THEN
    ALTER TABLE resources ADD COLUMN likes INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'downloads') THEN
    ALTER TABLE resources ADD COLUMN downloads INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add author_id column to resources table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'resources' 
                AND column_name = 'author_id') THEN
    ALTER TABLE resources ADD COLUMN author_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Ensure username column in user_profiles has a unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                WHERE conname = 'user_profiles_username_key') THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_username_key UNIQUE (username);
  END IF;
END $$;

-- Create index on username for faster lookups
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                WHERE indexname = 'user_profiles_username_idx') THEN
    CREATE INDEX user_profiles_username_idx ON user_profiles (username);
  END IF;
END $$;

-- Enable realtime for user_profiles if not already enabled
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE user_followers;

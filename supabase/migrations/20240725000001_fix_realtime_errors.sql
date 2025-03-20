-- Fix realtime errors by checking before adding tables to publication
DO $$
BEGIN
  -- Only try to add tables if they're not already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'user_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'resources'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE resources;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'study_groups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE study_groups;
  END IF;
END
$$;
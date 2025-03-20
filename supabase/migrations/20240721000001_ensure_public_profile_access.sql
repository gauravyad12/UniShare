-- Ensure public access to user_profiles table
DROP POLICY IF EXISTS "Allow public read access to user_profiles" ON user_profiles;
CREATE POLICY "Allow public read access to user_profiles"
  ON user_profiles FOR SELECT
  USING (true);

-- Make sure realtime is enabled for user_profiles
alter publication supabase_realtime add table user_profiles;

-- Ensure the user_profiles table exists with proper columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
    CREATE TABLE public.user_profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT UNIQUE NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      university TEXT,
      major TEXT,
      bio TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    );
  END IF;
END $$;

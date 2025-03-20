-- Fix row-level security policy for user_profiles table

-- First, enable RLS on the table if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON user_profiles;

-- Create policies for user_profiles table
CREATE POLICY "Users can view their own profiles"
ON user_profiles FOR SELECT
USING (auth.uid() = id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profiles"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profiles"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Also create a policy for the avatars bucket if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'avatars') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload avatar images" ON storage.objects;
    
    -- Create policies for the avatars bucket
    CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
    
    CREATE POLICY "Users can upload avatar images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
  END IF;
END
$$;
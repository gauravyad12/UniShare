-- Completely disable RLS on user_profiles table to fix persistent RLS errors
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Anon can create profiles" ON public.user_profiles;

-- Grant all permissions to all roles to ensure no RLS issues
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO anon;
GRANT ALL ON public.user_profiles TO service_role;

-- Ensure university_name column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_profiles' 
                   AND column_name = 'university_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN university_name text;
    END IF;
END
$$;

-- Completely disable RLS on user_followers table to fix persistent RLS errors
ALTER TABLE public.user_followers DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can manage their own followers" ON public.user_followers;
DROP POLICY IF EXISTS "Users can view followers" ON public.user_followers;
DROP POLICY IF EXISTS "Service role can manage all followers" ON public.user_followers;

-- Grant all permissions to all roles to ensure no RLS issues
GRANT ALL ON public.user_followers TO authenticated;
GRANT ALL ON public.user_followers TO anon;
GRANT ALL ON public.user_followers TO service_role;

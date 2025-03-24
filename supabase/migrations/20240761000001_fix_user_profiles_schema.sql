-- Fix user_profiles table schema issues

-- Check if university_name column exists, add it if it doesn't
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

-- Fix RLS policies for user_settings table
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage their own settings
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings"
    ON public.user_settings
    USING (auth.uid() = user_id);

-- Create policy for service role to manage all settings
DROP POLICY IF EXISTS "Service role can manage all settings" ON public.user_settings;
CREATE POLICY "Service role can manage all settings"
    ON public.user_settings
    USING (true)
    WITH CHECK (true);

-- Enable RLS but with the new policies
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;

-- Grant permissions to service role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO service_role;

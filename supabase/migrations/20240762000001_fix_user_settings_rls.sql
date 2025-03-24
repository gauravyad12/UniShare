-- First disable RLS on the user_settings table
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Service role can manage all settings" ON public.user_settings;

-- Create policy for authenticated users to manage their own settings
CREATE POLICY "Users can manage their own settings"
    ON public.user_settings
    FOR ALL
    USING (auth.uid() = user_id);

-- Create policy for service role to manage all settings
CREATE POLICY "Service role can manage all settings"
    ON public.user_settings
    FOR ALL
    USING (true);

-- Enable RLS with the new policies
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;

-- Grant permissions to service role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO service_role;

-- Grant permissions to anon role for initial creation
GRANT SELECT, INSERT ON public.user_settings TO anon;

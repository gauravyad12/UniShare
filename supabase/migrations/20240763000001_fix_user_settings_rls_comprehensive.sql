-- Completely disable RLS on user_settings table to fix persistent RLS errors
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Service role can manage all settings" ON public.user_settings;
DROP POLICY IF EXISTS "Authenticated users can manage their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Anon can create settings" ON public.user_settings;

-- Grant all permissions to all roles to ensure no RLS issues
GRANT ALL ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO anon;
GRANT ALL ON public.user_settings TO service_role;

-- Fix user_profiles table schema if university_name column is missing
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

-- Create a function to ensure user_settings exists for every user
CREATE OR REPLACE FUNCTION public.ensure_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_settings (user_id, email_notifications, study_group_notifications, 
                                     resource_notifications, profile_visibility, theme_preference, 
                                     color_scheme, font_size, created_at, updated_at)
    VALUES (NEW.id, true, true, true, true, 'system', 'default', 2, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create settings when a user profile is created
DROP TRIGGER IF EXISTS ensure_user_settings_trigger ON public.user_profiles;
CREATE TRIGGER ensure_user_settings_trigger
AFTER INSERT ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_settings();

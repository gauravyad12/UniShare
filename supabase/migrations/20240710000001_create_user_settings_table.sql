-- Create user_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  study_group_notifications BOOLEAN DEFAULT TRUE,
  resource_notifications BOOLEAN DEFAULT TRUE,
  profile_visibility BOOLEAN DEFAULT TRUE,
  theme_preference TEXT DEFAULT 'system',
  color_scheme TEXT DEFAULT 'blue',
  font_size INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RPC function to create the table if it doesn't exist
CREATE OR REPLACE FUNCTION create_user_settings_table()
RETURNS VOID AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    study_group_notifications BOOLEAN DEFAULT TRUE,
    resource_notifications BOOLEAN DEFAULT TRUE,
    profile_visibility BOOLEAN DEFAULT TRUE,
    theme_preference TEXT DEFAULT 'system',
    color_scheme TEXT DEFAULT 'blue',
    font_size INTEGER DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;

-- Create policy for user_settings
DROP POLICY IF EXISTS "Users can view and update their own settings" ON user_settings;
CREATE POLICY "Users can view and update their own settings"
  ON user_settings
  USING (auth.uid() = user_id);

-- Enable RLS on user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

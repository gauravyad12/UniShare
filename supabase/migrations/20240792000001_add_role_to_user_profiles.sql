-- Add role column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create index on role column for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Update RLS policies to allow access based on role
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id OR role = 'admin');

-- Set admin role for specific user
UPDATE user_profiles SET role = 'admin' WHERE id = '9f9f1573-520c-4f97-b33a-6bf0b0fd059c';

-- Create a function to allow the service role to delete users
-- This is needed because the auth.users table has RLS enabled

-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function that can be called by the service role to delete a user
CREATE OR REPLACE FUNCTION public.delete_user_by_id(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = user_id;
  
  -- The rest of the tables should cascade delete or be handled by the API
  -- This function primarily ensures we can delete from auth.users
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the service role and anon role
GRANT EXECUTE ON FUNCTION public.delete_user_by_id TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_by_id TO anon;
GRANT EXECUTE ON FUNCTION public.delete_user_by_id TO authenticated;

-- Make sure the function is accessible via RPC
COMMENT ON FUNCTION public.delete_user_by_id IS 'Allows deletion of a user from auth.users';

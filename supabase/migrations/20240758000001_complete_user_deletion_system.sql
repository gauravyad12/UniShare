-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.delete_user_by_id(UUID);
DROP FUNCTION IF EXISTS public.handle_auth_user_delete();
DROP TRIGGER IF EXISTS on_auth_user_delete ON auth.users;

-- Create a more robust delete_user_by_id function
CREATE OR REPLACE FUNCTION public.delete_user_by_id(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN := FALSE;
BEGIN
  -- First delete from public tables to avoid foreign key constraints
  -- Delete from user_settings
  DELETE FROM public.user_settings WHERE user_id = user_id;
  
  -- Delete from user_profiles
  DELETE FROM public.user_profiles WHERE id = user_id;
  
  -- Delete from user_followers
  DELETE FROM public.user_followers WHERE user_id = user_id OR follower_id = user_id;
  
  -- Delete from notifications
  DELETE FROM public.notifications WHERE user_id = user_id;
  
  -- Delete from sent_invitations
  DELETE FROM public.sent_invitations WHERE sent_by = user_id;
  
  -- Finally delete from auth.users
  DELETE FROM auth.users WHERE id = user_id;
  
  -- Check if deletion was successful
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    success := TRUE;
  END IF;
  
  RETURN success;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in delete_user_by_id: %', SQLERRM;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.delete_user_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_by_id(UUID) TO service_role;

-- Create a direct SQL function to delete users (alternative approach)
CREATE OR REPLACE FUNCTION public.force_delete_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN := FALSE;
BEGIN
  -- Direct SQL to delete the user
  EXECUTE 'DELETE FROM auth.users WHERE id = $1' USING user_id;
  
  -- Check if deletion was successful
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    success := TRUE;
  END IF;
  
  RETURN success;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in force_delete_user: %', SQLERRM;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.force_delete_user(UUID) TO service_role;

-- Ensure service role has delete permissions on auth.users
GRANT DELETE ON auth.users TO service_role;

-- Add comment for RPC access
COMMENT ON FUNCTION public.delete_user_by_id IS 'Deletes a user and related data';
COMMENT ON FUNCTION public.force_delete_user IS 'Force deletes a user from auth.users';

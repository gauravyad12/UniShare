-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.delete_user_by_id(UUID);

-- Create an improved version of the delete_user_by_id function
CREATE OR REPLACE FUNCTION public.delete_user_by_id(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN;
BEGIN
  -- Attempt to delete the user from auth.users
  DELETE FROM auth.users WHERE id = user_id;
  
  -- Check if the deletion was successful
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    success := TRUE;
  ELSE
    success := FALSE;
  END IF;
  
  RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to necessary roles
GRANT EXECUTE ON FUNCTION public.delete_user_by_id TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_by_id TO authenticated;

-- Make sure the function is accessible via RPC
COMMENT ON FUNCTION public.delete_user_by_id IS 'Allows deletion of a user from auth.users with confirmation';

-- Create a trigger function to handle cascading deletes for auth.users
CREATE OR REPLACE FUNCTION public.handle_auth_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a safety check to ensure we don't accidentally delete user data
  -- when a user is deleted from auth.users
  IF OLD.id IS NOT NULL THEN
    -- Delete from user_profiles if it exists
    DELETE FROM public.user_profiles WHERE id = OLD.id;
    
    -- Delete from user_settings if it exists
    DELETE FROM public.user_settings WHERE user_id = OLD.id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_delete ON auth.users;
CREATE TRIGGER on_auth_user_delete
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_delete();

-- Grant permissions to the service role to delete from auth.users
GRANT DELETE ON auth.users TO service_role;

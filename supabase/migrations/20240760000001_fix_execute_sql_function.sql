-- Drop the function if it exists to avoid errors when recreating it
DROP FUNCTION IF EXISTS public.execute_sql;

-- Create the execute_sql function with proper parameter order and error handling
CREATE OR REPLACE FUNCTION public.execute_sql(query text, params jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  param_values text[] := '{}';
  i integer;
BEGIN
  -- Convert jsonb array to text array for parameters
  IF jsonb_array_length(params) > 0 THEN
    FOR i IN 0..jsonb_array_length(params)-1 LOOP
      param_values := param_values || params->i;
    END LOOP;
  END IF;

  -- Execute the query with parameters
  EXECUTE query INTO result USING VARIADIC param_values;
  
  -- Return the result as jsonb
  RETURN COALESCE(result, '{}'::jsonb);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM, 'code', SQLSTATE);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_sql TO service_role;

-- Create a function specifically for deleting users that's more reliable
CREATE OR REPLACE FUNCTION public.force_delete_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists boolean;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id) INTO user_exists;
  
  -- Only attempt deletion if user exists
  IF user_exists THEN
    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = user_id;
    RETURN true;
  ELSE
    -- User doesn't exist, return true since there's nothing to delete
    RETURN true;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.force_delete_user TO service_role;

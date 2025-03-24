-- Create a function to execute raw SQL (for admin use only)
CREATE OR REPLACE FUNCTION execute_sql(query text, params text[] DEFAULT '{}')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE query INTO result USING params;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE);
END;
$$;

-- Only grant execute to service_role
GRANT EXECUTE ON FUNCTION execute_sql TO service_role;

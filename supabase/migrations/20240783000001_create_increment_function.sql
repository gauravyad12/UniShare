-- Create a generic function to increment a column value in any table
CREATE OR REPLACE FUNCTION increment_column_value(
  p_table_name TEXT,
  p_column_name TEXT,
  p_record_id UUID,
  p_increment_by INTEGER DEFAULT 1
) RETURNS VOID AS $$
DECLARE
  query TEXT;
BEGIN
  query := format('UPDATE %I SET %I = COALESCE(%I, 0) + %L WHERE id = %L',
                 p_table_name, p_column_name, p_column_name, p_increment_by, p_record_id);
  EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

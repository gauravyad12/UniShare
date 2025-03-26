-- Add comment_count column to resources table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'comment_count') THEN
    ALTER TABLE resources ADD COLUMN comment_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Update all resources with the correct comment count
UPDATE resources r
SET comment_count = (
  SELECT COUNT(*) 
  FROM resource_comments c 
  WHERE c.resource_id = r.id
);

-- Create or replace the increment_column_value function
CREATE OR REPLACE FUNCTION increment_column_value(
  p_table_name text,
  p_column_name text,
  p_record_id uuid,
  p_increment_by integer DEFAULT 1
) RETURNS void AS $$
DECLARE
  query text;
BEGIN
  query := format('UPDATE %I SET %I = GREATEST(0, COALESCE(%I, 0) + $1) WHERE id = $2', 
                 p_table_name, p_column_name, p_column_name);
  EXECUTE query USING p_increment_by, p_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to update comment_count when comments are added or deleted
CREATE OR REPLACE FUNCTION update_resource_comment_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment the comment count
    PERFORM increment_column_value('resources', 'comment_count', NEW.resource_id, 1);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement the comment count
    PERFORM increment_column_value('resources', 'comment_count', OLD.resource_id, -1);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_resource_comment_count_trigger ON resource_comments;

-- Create the trigger
CREATE TRIGGER update_resource_comment_count_trigger
AFTER INSERT OR DELETE ON resource_comments
FOR EACH ROW
EXECUTE FUNCTION update_resource_comment_count();

-- Check if resources table is already in the publication before adding it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'resources'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE resources;
  END IF;
END
$$;
-- Create a function to update the likes count in the resources table
CREATE OR REPLACE FUNCTION update_resource_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the likes count in the resources table
  IF TG_OP = 'INSERT' THEN
    UPDATE resources
    SET likes = (SELECT COUNT(*) FROM resource_likes WHERE resource_id = NEW.resource_id)
    WHERE id = NEW.resource_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE resources
    SET likes = (SELECT COUNT(*) FROM resource_likes WHERE resource_id = OLD.resource_id)
    WHERE id = OLD.resource_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_resource_likes_count_trigger ON resource_likes;

-- Create the trigger
CREATE TRIGGER update_resource_likes_count_trigger
AFTER INSERT OR DELETE ON resource_likes
FOR EACH ROW
EXECUTE FUNCTION update_resource_likes_count();

-- Update all resources with the correct like count
UPDATE resources r
SET likes = (SELECT COUNT(*) FROM resource_likes WHERE resource_id = r.id);

-- Make sure resource_likes table has realtime enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'resource_likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE resource_likes;
  END IF;
END
$$;
-- Drop the view if it exists to avoid errors
DROP VIEW IF EXISTS resource_comments_with_profiles;

-- Create a view to join resource comments with user profiles
CREATE VIEW resource_comments_with_profiles AS
SELECT 
  rc.id,
  rc.comment,
  rc.created_at,
  rc.updated_at,
  rc.user_id,
  rc.resource_id,
  up.id as profile_id,
  up.full_name,
  up.username,
  up.avatar_url
FROM resource_comments rc
LEFT JOIN user_profiles up ON rc.user_id = up.id;

-- Make sure the view is accessible
GRANT SELECT ON resource_comments_with_profiles TO authenticated, anon, service_role;

-- Note: Views cannot be added to publications directly.
-- If you need realtime updates, you'll need to track the underlying table (resource_comments) instead.

-- Check if resource_comments is already in the publication before adding it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'resource_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE resource_comments;
  END IF;
END
$$;
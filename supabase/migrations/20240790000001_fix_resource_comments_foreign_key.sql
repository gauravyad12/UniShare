-- Fix resource comments foreign key relationship

-- First, ensure the resource_id foreign key exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'resource_comments_resource_id_fkey' 
    AND table_name = 'resource_comments'
  ) THEN
    ALTER TABLE resource_comments
    ADD CONSTRAINT resource_comments_resource_id_fkey
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create a view to simplify joining comments with user profiles
CREATE OR REPLACE VIEW resource_comments_with_profiles AS
SELECT 
  rc.id,
  rc.comment,
  rc.created_at,
  rc.updated_at,
  rc.user_id,
  rc.resource_id,
  up.full_name,
  up.username,
  up.avatar_url
FROM resource_comments rc
LEFT JOIN user_profiles up ON rc.user_id = up.id;

-- Make sure the view is accessible
GRANT SELECT ON resource_comments_with_profiles TO authenticated, anon, service_role;

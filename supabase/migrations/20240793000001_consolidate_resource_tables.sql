-- Drop unused tables
DROP TABLE IF EXISTS resource_ratings;
DROP TABLE IF EXISTS resource_tags;

-- Ensure resource_comments has all necessary columns
ALTER TABLE resource_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create a better view for comments with user profiles
DROP VIEW IF EXISTS resource_comments_with_profiles;
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

-- Create a consolidated view for resources with comment count
DROP VIEW IF EXISTS resources_with_comments;
CREATE VIEW resources_with_comments AS
SELECT 
  r.*,
  COALESCE(c.comment_count, 0) AS comment_count
FROM resources r
LEFT JOIN (
  SELECT 
    resource_id, 
    COUNT(*) AS comment_count
  FROM resource_comments
  GROUP BY resource_id
) c ON r.id = c.resource_id;

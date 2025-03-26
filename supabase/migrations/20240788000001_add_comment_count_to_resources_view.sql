-- Create a view that includes comment counts for resources
CREATE OR REPLACE VIEW resources_with_comments AS
SELECT 
  r.*,
  COALESCE(c.comment_count, 0)::integer AS comment_count
FROM 
  resources r
LEFT JOIN (
  SELECT 
    resource_id, 
    COUNT(id) AS comment_count
  FROM 
    resource_comments
  GROUP BY 
    resource_id
) c ON r.id = c.resource_id;

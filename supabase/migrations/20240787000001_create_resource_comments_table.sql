-- Create resource_comments table if it doesn't exist already
-- Note: This table already exists in the schema, so this is just to ensure it's properly configured

-- Enable RLS on resource_comments table
ALTER TABLE resource_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for resource_comments table
DROP POLICY IF EXISTS "Users can view comments on resources" ON resource_comments;
CREATE POLICY "Users can view comments on resources"
ON resource_comments FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert their own comments" ON resource_comments;
CREATE POLICY "Users can insert their own comments"
ON resource_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON resource_comments;
CREATE POLICY "Users can update their own comments"
ON resource_comments FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON resource_comments;
CREATE POLICY "Users can delete their own comments"
ON resource_comments FOR DELETE
USING (auth.uid() = user_id);

-- Add realtime support for comments
ALTER PUBLICATION supabase_realtime ADD TABLE resource_comments;

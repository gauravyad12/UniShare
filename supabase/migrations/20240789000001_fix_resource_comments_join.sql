-- Fix resource comments join by ensuring proper foreign key relationship

-- First, ensure the foreign key exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'resource_comments_user_id_fkey' 
    AND table_name = 'resource_comments'
  ) THEN
    ALTER TABLE resource_comments
    ADD CONSTRAINT resource_comments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

-- Ensure RLS is properly configured for resource comments
ALTER TABLE resource_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all comments" ON resource_comments;
DROP POLICY IF EXISTS "Users can create their own comments" ON resource_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON resource_comments;

-- Create policies
CREATE POLICY "Users can view all comments"
ON resource_comments FOR SELECT
USING (true);

CREATE POLICY "Users can create their own comments"
ON resource_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON resource_comments FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for resource_comments
ALTER PUBLICATION supabase_realtime ADD TABLE resource_comments;

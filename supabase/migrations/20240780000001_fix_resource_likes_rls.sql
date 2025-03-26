-- Fix RLS policies for resource_likes table

-- First, ensure the table exists
CREATE TABLE IF NOT EXISTS resource_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resource_id, user_id)
);

-- Enable row level security
ALTER TABLE resource_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own likes" ON resource_likes;
DROP POLICY IF EXISTS "Users can view all likes" ON resource_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON resource_likes;

-- Create policies
CREATE POLICY "Users can insert their own likes"
ON resource_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all likes"
ON resource_likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can delete their own likes"
ON resource_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Make sure the table is in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE resource_likes;

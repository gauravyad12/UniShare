-- Migration to create the group_chat_typing_status table

-- Create the group_chat_typing_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS group_chat_typing_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  is_typing BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(study_group_id, user_id)
);

-- Add comment to the table
COMMENT ON TABLE group_chat_typing_status IS 'Tracks which users are currently typing in which study groups';

-- Add RLS policies to the table
ALTER TABLE group_chat_typing_status ENABLE ROW LEVEL SECURITY;

-- Users can see typing status in groups they are members of
CREATE POLICY "Users can view typing status in their groups" 
ON group_chat_typing_status 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM study_group_members sgm
    WHERE sgm.study_group_id = group_chat_typing_status.study_group_id 
    AND sgm.user_id = auth.uid()
  )
);

-- Users can insert/update their own typing status
CREATE POLICY "Users can insert their own typing status" 
ON group_chat_typing_status 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own typing status" 
ON group_chat_typing_status 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create an index for faster lookups
CREATE INDEX idx_group_chat_typing_status_group_user ON group_chat_typing_status(study_group_id, user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_group_chat_typing_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before each update
CREATE TRIGGER update_group_chat_typing_status_updated_at
BEFORE UPDATE ON group_chat_typing_status
FOR EACH ROW
EXECUTE FUNCTION update_group_chat_typing_status_updated_at();

-- Create a function to automatically clean up old typing statuses
CREATE OR REPLACE FUNCTION cleanup_old_typing_statuses()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete typing statuses that haven't been updated in the last 10 seconds
  DELETE FROM group_chat_typing_status
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the cleanup function after each insert or update
CREATE TRIGGER cleanup_old_typing_statuses
AFTER INSERT OR UPDATE ON group_chat_typing_status
FOR EACH STATEMENT
EXECUTE FUNCTION cleanup_old_typing_statuses();

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON group_chat_typing_status TO authenticated;

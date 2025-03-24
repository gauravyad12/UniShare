-- Enable Row Level Security on invite_codes table
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read only their own invite codes
DROP POLICY IF EXISTS "Users can view their own invite codes" ON invite_codes;
CREATE POLICY "Users can view their own invite codes"
  ON invite_codes FOR SELECT
  USING (auth.uid() = created_by);

-- Policy to allow users to update only their own invite codes
DROP POLICY IF EXISTS "Users can update their own invite codes" ON invite_codes;
CREATE POLICY "Users can update their own invite codes"
  ON invite_codes FOR UPDATE
  USING (auth.uid() = created_by);

-- Policy to allow users to insert their own invite codes
DROP POLICY IF EXISTS "Users can insert their own invite codes" ON invite_codes;
CREATE POLICY "Users can insert their own invite codes"
  ON invite_codes FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Add a policy to allow users to read invite codes by code for verification
DROP POLICY IF EXISTS "Anyone can view invite codes by code" ON invite_codes;
CREATE POLICY "Anyone can view invite codes by code"
  ON invite_codes FOR SELECT
  USING (true);

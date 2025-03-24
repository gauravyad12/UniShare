-- Ensure RLS is disabled for invite_codes table
ALTER TABLE invite_codes DISABLE ROW LEVEL SECURITY;

-- Create a policy for invite_codes table that allows users to create their own invite codes
DROP POLICY IF EXISTS "Users can create their own invite codes" ON invite_codes;
CREATE POLICY "Users can create their own invite codes"
  ON invite_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Create a policy for invite_codes table that allows users to read their own invite codes
DROP POLICY IF EXISTS "Users can read their own invite codes" ON invite_codes;
CREATE POLICY "Users can read their own invite codes"
  ON invite_codes
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Create a policy for invite_codes table that allows users to update their own invite codes
DROP POLICY IF EXISTS "Users can update their own invite codes" ON invite_codes;
CREATE POLICY "Users can update their own invite codes"
  ON invite_codes
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Ensure realtime is enabled for invite_codes table
ALTER PUBLICATION supabase_realtime ADD TABLE invite_codes;

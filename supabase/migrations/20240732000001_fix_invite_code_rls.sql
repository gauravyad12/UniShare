-- Fix row-level security policy for invite_codes table
ALTER TABLE invite_codes DISABLE ROW LEVEL SECURITY;

-- Enable realtime for invite_codes table
ALTER PUBLICATION supabase_realtime ADD TABLE invite_codes;

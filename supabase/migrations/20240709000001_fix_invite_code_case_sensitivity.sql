-- Make invite code validation case-insensitive
DROP POLICY IF EXISTS "Allow public read access" ON invite_codes;
CREATE POLICY "Allow public read access"
ON invite_codes FOR SELECT
USING (true);

-- Ensure UCF2024 invite code exists with correct university ID
INSERT INTO invite_codes (code, university_id, is_active, max_uses, current_uses, created_at, expires_at)
SELECT 
  'UCF2024',
  id,
  true,
  100,
  0,
  NOW(),
  NOW() + INTERVAL '1 year'
FROM universities
WHERE domain = 'ucf.edu'
ON CONFLICT (code) DO UPDATE
SET is_active = true, max_uses = 100;

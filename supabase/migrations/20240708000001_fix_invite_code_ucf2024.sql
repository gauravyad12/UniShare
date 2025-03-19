-- Create a new invite code UCF2024 for University of Central Florida
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
WHERE name = 'University of Central Florida'
ON CONFLICT DO NOTHING;

-- Create a new invite code for University of Central Florida
INSERT INTO invite_codes (code, university_id, is_active, max_uses, current_uses, created_at, expires_at)
SELECT 
  'UCF-TEST-2024',
  id,
  true,
  100,
  0,
  NOW(),
  NOW() + INTERVAL '1 year'
FROM universities
WHERE name = 'University of Central Florida'
ON CONFLICT DO NOTHING;

-- Create a test user
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
VALUES (
  gen_random_uuid(),
  'test.student@ucf.edu',
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test Student","email":"test.student@ucf.edu"}'
)
ON CONFLICT DO NOTHING;

-- Enable realtime for invite_codes table
alter publication supabase_realtime add table invite_codes;
-- Create a test invite code for University of Central Florida

-- First, ensure the university exists
INSERT INTO public.universities (name, domain, created_at)
VALUES ('University of Central Florida', 'ucf.edu', NOW())
ON CONFLICT (domain) DO NOTHING;

-- Create an invite code for UCF
INSERT INTO public.invite_codes (code, created_at, is_active, max_uses, current_uses, university_id)
SELECT 
  'UCF2024',
  NOW(),
  true,
  100,
  0,
  id
FROM public.universities
WHERE domain = 'ucf.edu'
ON CONFLICT DO NOTHING;

alter publication supabase_realtime add table invite_codes;

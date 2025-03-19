-- Create bad_words table to store prohibited usernames
CREATE TABLE IF NOT EXISTS public.bad_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add username field to user_profiles table
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles (username);

-- Add some initial bad words (this is a minimal list, should be expanded)
INSERT INTO public.bad_words (word) 
VALUES 
('admin'),
('moderator'),
('unishare'),
('support'),
('system')
ON CONFLICT (word) DO NOTHING;

-- Enable realtime for bad_words table
ALTER PUBLICATION supabase_realtime ADD TABLE bad_words;

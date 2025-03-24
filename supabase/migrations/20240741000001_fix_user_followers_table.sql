-- Fix user_followers table to ensure it has the correct structure and constraints

-- First, check if the table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS public.user_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    follower_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, follower_id)
);

-- Add comment to the table
COMMENT ON TABLE public.user_followers IS 'Stores user follow relationships';

-- Enable row-level security
ALTER TABLE public.user_followers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all follow relationships" ON public.user_followers;
DROP POLICY IF EXISTS "Users can create their own follow relationships" ON public.user_followers;
DROP POLICY IF EXISTS "Users can delete their own follow relationships" ON public.user_followers;

-- Create policies
CREATE POLICY "Users can view all follow relationships"
    ON public.user_followers FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own follow relationships"
    ON public.user_followers FOR INSERT
    WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can delete their own follow relationships"
    ON public.user_followers FOR DELETE
    USING (follower_id = auth.uid());

-- Add to realtime publication if not already added
DO $$ 
DECLARE
  table_exists_in_publication BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'user_followers'
  ) INTO table_exists_in_publication;
  
  IF NOT table_exists_in_publication THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.user_followers';
  END IF;
END
$$;
-- Fix storage policies for resources bucket

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Allow resource owners to update their resources" ON storage.objects;
DROP POLICY IF EXISTS "Allow resource owners to delete their resources" ON storage.objects;
DROP POLICY IF EXISTS "Resource owners can update" ON storage.objects;
DROP POLICY IF EXISTS "Resource owners can delete" ON storage.objects;

-- Create fixed policies with proper type casting
CREATE POLICY "Resource owners can update fixed" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resources' AND (owner)::text = (auth.uid())::text);

CREATE POLICY "Resource owners can delete fixed" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'resources' AND (owner)::text = (auth.uid())::text);

-- Create resources table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL,
  course_code TEXT,
  file_url TEXT,
  external_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id),
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0
);

-- Enable RLS on resources table
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create policies for resources table
CREATE POLICY "Public read access" ON public.resources
  FOR SELECT
  USING (true);

CREATE POLICY "Authors can update their resources" ON public.resources
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their resources" ON public.resources
  FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Authenticated users can insert resources" ON public.resources
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable realtime for resources
-- Check if the table is already in the publication before adding it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'resources'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.resources;
  END IF;
END
$$;
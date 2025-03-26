-- Fix RLS policies for resources table

-- First disable RLS to ensure we can modify policies
ALTER TABLE public.resources DISABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Public read access" ON public.resources;
DROP POLICY IF EXISTS "Authors can update their resources" ON public.resources;
DROP POLICY IF EXISTS "Authors can delete their resources" ON public.resources;
DROP POLICY IF EXISTS "Authenticated users can insert resources" ON public.resources;

-- Re-enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper permissions
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

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

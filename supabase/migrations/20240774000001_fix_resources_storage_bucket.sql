-- Create resources storage bucket if it doesn't exist already
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access policies for the resources bucket

-- Allow public read access to resources
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'resources');

-- Allow authenticated users to upload resources
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resources');

-- Allow resource owners to update their resources
CREATE POLICY "Resource owners can update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resources' AND owner::text = auth.uid()::text);

-- Allow resource owners to delete their resources
CREATE POLICY "Resource owners can delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'resources' AND owner::text = auth.uid()::text);

-- Enable realtime for resources
ALTER PUBLICATION supabase_realtime ADD TABLE storage.objects;

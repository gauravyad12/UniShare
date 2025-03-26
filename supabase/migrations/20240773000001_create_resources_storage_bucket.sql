-- Create resources storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access policies for the resources bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload resources" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload resources"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resources');

DROP POLICY IF EXISTS "Allow public read access to resources" ON storage.objects;
CREATE POLICY "Allow public read access to resources"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'resources');

DROP POLICY IF EXISTS "Allow resource owners to update their resources" ON storage.objects;
CREATE POLICY "Allow resource owners to update their resources"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'resources' AND (auth.uid())::text = owner::text);

DROP POLICY IF EXISTS "Allow resource owners to delete their resources" ON storage.objects;
CREATE POLICY "Allow resource owners to delete their resources"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'resources' AND (auth.uid())::text = owner::text);

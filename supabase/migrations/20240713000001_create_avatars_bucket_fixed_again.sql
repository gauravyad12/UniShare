-- Create avatars bucket if it doesn't exist
DO $$
BEGIN
    -- Check if the bucket exists
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'avatars'
    ) THEN
        -- Create the bucket
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('avatars', 'avatars', true);
    END IF;
END
$$;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Create policy to allow authenticated users to upload
DROP POLICY IF EXISTS "Authenticated Users Can Upload" ON storage.objects;
CREATE POLICY "Authenticated Users Can Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Create policy to allow users to update their own objects
DROP POLICY IF EXISTS "Users Can Update Own Objects" ON storage.objects;
CREATE POLICY "Users Can Update Own Objects"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

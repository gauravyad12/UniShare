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

        -- Set up public access policy
        INSERT INTO storage.policies (name, definition, bucket_id)
        VALUES (
            'Public Read Access',
            '(bucket_id = ''avatars''::text)::boolean',
            'avatars'
        );
    END IF;
END
$$;
-- Migration to add message_count and last_message_at columns to study_groups table

-- Add message_count column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'study_groups' AND column_name = 'message_count'
    ) THEN
        ALTER TABLE study_groups ADD COLUMN message_count INT DEFAULT 0;
    END IF;
END $$;

-- Add last_message_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'study_groups' AND column_name = 'last_message_at'
    ) THEN
        ALTER TABLE study_groups ADD COLUMN last_message_at TIMESTAMPTZ;
    END IF;
END $$;

-- Comment on columns
COMMENT ON COLUMN study_groups.message_count IS 'Number of messages in the study group chat';
COMMENT ON COLUMN study_groups.last_message_at IS 'Timestamp of the last message in the study group chat';

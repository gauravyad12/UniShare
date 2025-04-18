-- Migration to drop the unused group_chat_read_status table

-- Drop the table if it exists
DROP TABLE IF EXISTS group_chat_read_status;

-- Comment explaining the migration
COMMENT ON SCHEMA public IS 'Removed unused group_chat_read_status table in favor of message_read_status';

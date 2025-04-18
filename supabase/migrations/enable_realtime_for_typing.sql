-- Enable realtime for the group_chat_typing_status table
BEGIN;

-- Check if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_chat_typing_status') THEN
    -- Enable realtime for the table
    ALTER PUBLICATION supabase_realtime ADD TABLE group_chat_typing_status;
  END IF;
END $$;

COMMIT;

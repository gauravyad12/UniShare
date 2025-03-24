-- This migration fixes the previous error by not attempting to add the notifications table
-- to the supabase_realtime publication since it's already a member

-- Ensure the actor_id column exists in the notifications table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'notifications' AND column_name = 'actor_id') THEN
        ALTER TABLE notifications ADD COLUMN actor_id UUID REFERENCES auth.users(id);
    END IF;
END$$;

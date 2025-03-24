-- Add actor_id column to notifications table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'actor_id') THEN
    ALTER TABLE notifications ADD COLUMN actor_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Update the notifications table to make actor_id nullable
ALTER TABLE notifications ALTER COLUMN actor_id DROP NOT NULL;

-- Add index on actor_id for better performance
CREATE INDEX IF NOT EXISTS notifications_actor_id_idx ON notifications(actor_id);

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

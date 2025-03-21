-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for messages
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their received messages" ON messages;
CREATE POLICY "Users can update their received messages"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Enable realtime for notifications and messages
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Create function to send notification when a user is invited
CREATE OR REPLACE FUNCTION notify_on_invite_code_use()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_uses > OLD.current_uses THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.created_by,
      'Invite Code Used',
      'Someone used your invite code to join UniShare!',
      'invite',
      '/dashboard/invite'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invite code usage
DROP TRIGGER IF EXISTS invite_code_use_trigger ON invite_codes;
CREATE TRIGGER invite_code_use_trigger
  AFTER UPDATE OF current_uses ON invite_codes
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_invite_code_use();

-- Create function to send notification when a user follows another user
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  -- Get follower's username
  DECLARE follower_username TEXT;
  BEGIN
    SELECT username INTO follower_username FROM user_profiles WHERE id = NEW.follower_id;
    
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      'New Follower',
      'User @' || follower_username || ' started following you',
      'follow',
      '/dashboard/profile?username=' || follower_username
    );
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new followers
DROP TRIGGER IF EXISTS new_follower_trigger ON user_followers;
CREATE TRIGGER new_follower_trigger
  AFTER INSERT ON user_followers
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_follow();

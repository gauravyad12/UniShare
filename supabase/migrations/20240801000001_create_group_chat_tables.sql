-- Create group_chat_messages table
CREATE TABLE IF NOT EXISTS public.group_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS group_chat_messages_study_group_id_idx ON public.group_chat_messages(study_group_id);
CREATE INDEX IF NOT EXISTS group_chat_messages_sender_id_idx ON public.group_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS group_chat_messages_created_at_idx ON public.group_chat_messages(created_at);

-- Create message_read_status table to track which users have read which messages
CREATE TABLE IF NOT EXISTS public.message_read_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.group_chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(message_id, user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS message_read_status_message_id_idx ON public.message_read_status(message_id);
CREATE INDEX IF NOT EXISTS message_read_status_user_id_idx ON public.message_read_status(user_id);

-- Add last_message_at column to study_groups table to track when the last message was sent
ALTER TABLE public.study_groups 
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;

-- Add message_count column to study_groups table to track the number of messages
ALTER TABLE public.study_groups 
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

-- Add creator_name column to study_groups if it doesn't exist
ALTER TABLE public.study_groups 
ADD COLUMN IF NOT EXISTS creator_name TEXT;

-- Add member_count column to study_groups if it doesn't exist
ALTER TABLE public.study_groups 
ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 1;

-- Enable Row Level Security
ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view messages in groups they are members of
CREATE POLICY "Users can view messages in their groups" 
ON public.group_chat_messages
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.study_group_members
        WHERE study_group_members.study_group_id = group_chat_messages.study_group_id
        AND study_group_members.user_id = auth.uid()
    )
);

-- Users can insert messages in groups they are members of
CREATE POLICY "Users can insert messages in their groups" 
ON public.group_chat_messages
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.study_group_members
        WHERE study_group_members.study_group_id = group_chat_messages.study_group_id
        AND study_group_members.user_id = auth.uid()
    )
    AND sender_id = auth.uid()
);

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" 
ON public.group_chat_messages
FOR UPDATE 
USING (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" 
ON public.group_chat_messages
FOR DELETE 
USING (sender_id = auth.uid());

-- Users can view read status for messages in their groups
CREATE POLICY "Users can view read status in their groups" 
ON public.message_read_status
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.group_chat_messages
        JOIN public.study_group_members ON group_chat_messages.study_group_id = study_group_members.study_group_id
        WHERE group_chat_messages.id = message_read_status.message_id
        AND study_group_members.user_id = auth.uid()
    )
);

-- Users can insert read status for messages in their groups
CREATE POLICY "Users can insert read status in their groups" 
ON public.message_read_status
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.group_chat_messages
        JOIN public.study_group_members ON group_chat_messages.study_group_id = study_group_members.study_group_id
        WHERE group_chat_messages.id = message_read_status.message_id
        AND study_group_members.user_id = auth.uid()
    )
    AND user_id = auth.uid()
);

-- Create a view to get messages with sender profile information
CREATE OR REPLACE VIEW public.group_chat_messages_with_profiles AS
SELECT 
    m.id,
    m.study_group_id,
    m.sender_id,
    m.content,
    m.is_pinned,
    m.created_at,
    m.updated_at,
    p.full_name,
    p.username,
    p.avatar_url
FROM 
    public.group_chat_messages m
JOIN 
    public.user_profiles p ON m.sender_id = p.id;

-- Create a function to update the last_message_at and message_count in study_groups
CREATE OR REPLACE FUNCTION public.update_study_group_message_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the last_message_at and increment message_count
    UPDATE public.study_groups
    SET 
        last_message_at = NEW.created_at,
        message_count = COALESCE(message_count, 0) + 1
    WHERE id = NEW.study_group_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new message is inserted
DROP TRIGGER IF EXISTS update_study_group_message_stats_trigger ON public.group_chat_messages;
CREATE TRIGGER update_study_group_message_stats_trigger
AFTER INSERT ON public.group_chat_messages
FOR EACH ROW EXECUTE FUNCTION public.update_study_group_message_stats();

-- Create a function to decrement message_count when a message is deleted
CREATE OR REPLACE FUNCTION public.decrement_study_group_message_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrement message_count
    UPDATE public.study_groups
    SET message_count = GREATEST(COALESCE(message_count, 0) - 1, 0)
    WHERE id = OLD.study_group_id;
    
    -- Update last_message_at to the timestamp of the most recent message
    UPDATE public.study_groups sg
    SET last_message_at = (
        SELECT MAX(created_at)
        FROM public.group_chat_messages
        WHERE study_group_id = OLD.study_group_id
    )
    WHERE id = OLD.study_group_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a message is deleted
DROP TRIGGER IF EXISTS decrement_study_group_message_count_trigger ON public.group_chat_messages;
CREATE TRIGGER decrement_study_group_message_count_trigger
AFTER DELETE ON public.group_chat_messages
FOR EACH ROW EXECUTE FUNCTION public.decrement_study_group_message_count();

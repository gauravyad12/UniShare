-- Enable Row Level Security on the group_chat_messages_with_profiles view
ALTER VIEW public.group_chat_messages_with_profiles SECURITY INVOKER;

-- Enable Row Level Security
ALTER TABLE public.group_chat_messages_with_profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to view messages only from groups they are members of
CREATE POLICY "Users can view messages with profiles in their groups" 
ON public.group_chat_messages_with_profiles
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.study_group_members
        WHERE study_group_members.study_group_id = group_chat_messages_with_profiles.study_group_id
        AND study_group_members.user_id = auth.uid()
    )
);

-- Create user_followers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, follower_id)
);

-- Enable row level security
ALTER TABLE public.user_followers ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view all followers" ON public.user_followers;
CREATE POLICY "Users can view all followers"
    ON public.user_followers
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.user_followers;
CREATE POLICY "Users can follow others"
    ON public.user_followers
    FOR INSERT
    WITH CHECK (follower_id = auth.uid());

DROP POLICY IF EXISTS "Users can unfollow" ON public.user_followers;
CREATE POLICY "Users can unfollow"
    ON public.user_followers
    FOR DELETE
    USING (follower_id = auth.uid());

-- Add publication for realtime
alter publication supabase_realtime add table user_followers;

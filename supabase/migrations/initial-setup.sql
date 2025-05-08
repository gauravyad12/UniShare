-- Combined migration file that includes all necessary database setup

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY NOT NULL,
    avatar_url text,
    user_id text UNIQUE,
    token_identifier text NOT NULL,
    subscription text,
    credits text,
    image text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    email text,
    name text,
    full_name text
);

-- User Profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY NOT NULL,
    university_id uuid,
    full_name text,
    major text,
    graduation_year integer,
    bio text,
    avatar_url text,
    is_verified boolean,
    invite_code_id uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    username text,
    university_name text,
    role text,
    follower_count integer DEFAULT 0,
    following_count integer DEFAULT 0,
    email text,
    instance_id uuid
);

-- User Settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    theme text DEFAULT 'system',
    notifications_enabled boolean DEFAULT true,
    email_notifications_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- User Followers table
CREATE TABLE IF NOT EXISTS public.user_followers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    following_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(follower_id, following_id)
);

-- Study Groups table
CREATE TABLE IF NOT EXISTS public.study_groups (
    id uuid PRIMARY KEY NOT NULL,
    name text NOT NULL,
    description text,
    course_code text,
    university_id uuid,
    created_by uuid,
    is_private boolean DEFAULT false,
    max_members integer DEFAULT 50,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    message_count integer DEFAULT 0,
    last_message_at timestamp with time zone,
    member_count integer DEFAULT 0
);

-- Study Group Members table
CREATE TABLE IF NOT EXISTS public.study_group_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    study_group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role text DEFAULT 'member',
    joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(study_group_id, user_id)
);

-- Study Group Invitations table
CREATE TABLE IF NOT EXISTS public.study_group_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    study_group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE,
    created_by uuid REFERENCES public.user_profiles(id),
    code text UNIQUE,
    expires_at timestamp with time zone,
    max_uses integer,
    use_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Group Chat Messages table
CREATE TABLE IF NOT EXISTS public.group_chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    study_group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES public.user_profiles(id),
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Group Chat Typing Status table
CREATE TABLE IF NOT EXISTS public.group_chat_typing_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    study_group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    is_typing boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(study_group_id, user_id)
);



-- Resources table
CREATE TABLE IF NOT EXISTS public.resources (
    id uuid PRIMARY KEY NOT NULL,
    title text NOT NULL,
    description text,
    file_url text,
    external_link text,
    resource_type text NOT NULL,
    course_code text,
    professor text,
    university_id uuid,
    created_by uuid,
    is_approved boolean DEFAULT true,
    view_count integer DEFAULT 0,
    download_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    author_id uuid,
    likes integer DEFAULT 0,
    downloads integer DEFAULT 0,
    comment_count integer DEFAULT 0
);

-- Resource Comments table
CREATE TABLE IF NOT EXISTS public.resource_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.user_profiles(id),
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Resource Likes table
CREATE TABLE IF NOT EXISTS public.resource_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(resource_id, user_id)
);

-- Study Group Resources table
CREATE TABLE IF NOT EXISTS public.study_group_resources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    study_group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE,
    resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE,
    added_by uuid REFERENCES public.user_profiles(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(study_group_id, resource_id)
);

-- Universities table
CREATE TABLE IF NOT EXISTS public.universities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    domain text UNIQUE,
    country text,
    state text,
    city text,
    logo_url text,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Invite Codes table
CREATE TABLE IF NOT EXISTS public.invite_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    created_by uuid REFERENCES public.user_profiles(id),
    max_uses integer,
    use_count integer DEFAULT 0,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Sent Invitations table
CREATE TABLE IF NOT EXISTS public.sent_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_code_id uuid REFERENCES public.invite_codes(id),
    email text NOT NULL,
    sent_by uuid REFERENCES public.user_profiles(id),
    status text DEFAULT 'pending',
    sent_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    used_at timestamp with time zone
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    message text NOT NULL,
    type text,
    is_read boolean DEFAULT false,
    related_id uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Study Sessions table
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    study_group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    location text,
    created_by uuid REFERENCES public.user_profiles(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Session Attendees table
CREATE TABLE IF NOT EXISTS public.session_attendees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES public.study_sessions(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    status text DEFAULT 'going',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(session_id, user_id)
);

-- Bad Words table for content moderation
CREATE TABLE IF NOT EXISTS public.bad_words (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    word text UNIQUE NOT NULL,
    severity integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Common Domains table for email verification
CREATE TABLE IF NOT EXISTS public.common_domains (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    domain text UNIQUE NOT NULL,
    is_university boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create views for common queries
CREATE OR REPLACE VIEW group_chat_messages_with_profiles AS
SELECT
    m.id,
    m.study_group_id,
    m.sender_id,
    m.content,
    m.created_at,
    p.full_name,
    p.username,
    p.avatar_url
FROM
    group_chat_messages m
LEFT JOIN
    user_profiles p ON m.sender_id = p.id;

CREATE OR REPLACE VIEW resource_comments_with_profiles AS
SELECT
    c.id,
    c.resource_id,
    c.user_id,
    c.content,
    c.created_at,
    c.updated_at,
    p.full_name,
    p.username,
    p.avatar_url
FROM
    resource_comments c
LEFT JOIN
    user_profiles p ON c.user_id = p.id;

CREATE OR REPLACE VIEW resources_with_comments AS
SELECT
    r.*,
    COUNT(c.id) AS comment_count
FROM
    resources r
LEFT JOIN
    resource_comments c ON r.id = c.resource_id
GROUP BY
    r.id;

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.users(user_id),
    stripe_id text UNIQUE,
    price_id text,
    stripe_price_id text,
    currency text,
    interval text,
    status text,
    current_period_start bigint,
    current_period_end bigint,
    cancel_at_period_end boolean,
    amount bigint,
    started_at bigint,
    ends_at bigint,
    ended_at bigint,
    canceled_at bigint,
    customer_cancellation_reason text,
    customer_cancellation_comment text,
    metadata jsonb,
    custom_field_data jsonb,
    customer_id text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS subscriptions_stripe_id_idx ON public.subscriptions(stripe_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);

-- Create webhook_events table
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type text NOT NULL,
    type text NOT NULL,
    stripe_event_id text,
    data jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    modified_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS webhook_events_type_idx ON public.webhook_events(type);
CREATE INDEX IF NOT EXISTS webhook_events_stripe_event_id_idx ON public.webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS webhook_events_event_type_idx ON public.webhook_events(event_type);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_typing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Create policies for basic access control
DO $$
BEGIN
    -- Users can view own data
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'users'
        AND policyname = 'Users can view own data'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view own data" ON public.users
                FOR SELECT USING (auth.uid()::text = user_id)';
    END IF;

    -- Users can view own profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_profiles'
        AND policyname = 'Users can view own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view own profile" ON public.user_profiles
                FOR SELECT USING (auth.uid() = id)';
    END IF;

    -- Users can view public profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_profiles'
        AND policyname = 'Users can view public profiles'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view public profiles" ON public.user_profiles
                FOR SELECT USING (true)';
    END IF;

    -- Users can view their own study groups
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'study_groups'
        AND policyname = 'Users can view their own study groups'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view their own study groups" ON public.study_groups
                FOR SELECT USING (created_by = auth.uid() OR EXISTS (
                    SELECT 1 FROM study_group_members
                    WHERE study_group_id = id AND user_id = auth.uid()
                ))';
    END IF;

    -- Users can view public study groups
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'study_groups'
        AND policyname = 'Users can view public study groups'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view public study groups" ON public.study_groups
                FOR SELECT USING (is_private = false)';
    END IF;

    -- Users can view messages in their study groups
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'group_chat_messages'
        AND policyname = 'Users can view messages in their study groups'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view messages in their study groups" ON public.group_chat_messages
                FOR SELECT USING (EXISTS (
                    SELECT 1 FROM study_group_members
                    WHERE study_group_id = group_chat_messages.study_group_id AND user_id = auth.uid()
                ))';
    END IF;

    -- Users can view typing status in their groups
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'group_chat_typing_status'
        AND policyname = 'Users can view typing status in their groups'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view typing status in their groups" ON public.group_chat_typing_status
                FOR SELECT USING (EXISTS (
                    SELECT 1 FROM study_group_members
                    WHERE study_group_id = group_chat_typing_status.study_group_id AND user_id = auth.uid()
                ))';
    END IF;

    -- Users can view resources
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'resources'
        AND policyname = 'Users can view resources'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view resources" ON public.resources
                FOR SELECT USING (is_approved = true)';
    END IF;

    -- Users can view their own resources
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'resources'
        AND policyname = 'Users can view their own resources'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view their own resources" ON public.resources
                FOR SELECT USING (created_by = auth.uid())';
    END IF;

    -- Users can view subscriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'subscriptions'
        AND policyname = 'Users can view own subscriptions'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
                FOR SELECT USING (auth.uid()::text = user_id)';
    END IF;

    -- Service role can manage webhook events
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'webhook_events'
        AND policyname = 'Service role can manage webhook events'
    ) THEN
        EXECUTE 'CREATE POLICY "Service role can manage webhook events" ON public.webhook_events
                FOR ALL TO service_role USING (true)';
    END IF;
END
$$;

-- Create core database functions

-- User Management Functions

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (
    id,
    user_id,
    email,
    name,
    full_name,
    avatar_url,
    token_identifier,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.id::text,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    NEW.created_at,
    NEW.updated_at
  );

  -- Create user profile
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    avatar_url,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.created_at,
    NEW.updated_at
  );

  -- Create default user settings
  INSERT INTO public.user_settings (
    user_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.created_at,
    NEW.updated_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update users table
  UPDATE public.users
  SET
    email = NEW.email,
    name = NEW.raw_user_meta_data->>'name',
    full_name = NEW.raw_user_meta_data->>'full_name',
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    updated_at = NEW.updated_at
  WHERE user_id = NEW.id::text;

  -- Update user profile
  UPDATE public.user_profiles
  SET
    email = NEW.email,
    full_name = NEW.raw_user_meta_data->>'full_name',
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    updated_at = NEW.updated_at
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user is a member of a study group
CREATE OR REPLACE FUNCTION public.is_member_of_study_group(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM study_group_members
    WHERE study_group_id = p_group_id AND user_id = p_user_id
  );
END;
$$;

-- Function to check if a user is an admin of a study group
CREATE OR REPLACE FUNCTION public.is_admin_of_study_group(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_creator BOOLEAN;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is the creator
  SELECT (created_by = p_user_id) INTO v_is_creator
  FROM study_groups
  WHERE id = p_group_id;

  -- Check if user is an admin
  SELECT (role = 'admin') INTO v_is_admin
  FROM study_group_members
  WHERE study_group_id = p_group_id AND user_id = p_user_id;

  RETURN COALESCE(v_is_creator, false) OR COALESCE(v_is_admin, false);
END;
$$;

-- Function to check study group membership
CREATE OR REPLACE FUNCTION public.check_study_group_membership(p_group_id UUID, p_user_id UUID)
RETURNS TABLE(is_member BOOLEAN, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TRUE as is_member,
    sgm.role
  FROM
    study_group_members sgm
  WHERE
    sgm.study_group_id = p_group_id
    AND sgm.user_id = p_user_id;

  -- If no rows are returned, the user is not a member
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE as is_member, NULL::TEXT as role;
  END IF;
END;
$$;

-- Function to send a group chat message
CREATE OR REPLACE FUNCTION public.send_group_chat_message(
  p_group_id UUID,
  p_user_id UUID,
  p_content TEXT
)
RETURNS TABLE(
  id UUID,
  study_group_id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id UUID;
  v_created_at TIMESTAMPTZ;
BEGIN
  -- Check if the user is a member of the group
  IF NOT EXISTS (
    SELECT 1 FROM study_group_members
    WHERE study_group_id = p_group_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a member of this study group';
  END IF;

  -- Insert the message
  INSERT INTO group_chat_messages (study_group_id, sender_id, content, created_at)
  VALUES (p_group_id, p_user_id, p_content, NOW())
  RETURNING id, created_at INTO v_message_id, v_created_at;

  -- Update the last_message_at and message_count in the study group
  UPDATE study_groups
  SET
    last_message_at = v_created_at,
    message_count = COALESCE(message_count, 0) + 1
  WHERE id = p_group_id;

  -- Return the message with profile information
  RETURN QUERY
  SELECT
    m.id,
    m.study_group_id,
    m.sender_id,
    m.content,
    m.created_at,
    p.full_name,
    p.username,
    p.avatar_url
  FROM group_chat_messages m
  LEFT JOIN user_profiles p ON m.sender_id = p.id
  WHERE m.id = v_message_id;
END;
$$;

-- Function to update typing status
CREATE OR REPLACE FUNCTION public.upsert_typing_status(
  p_group_id UUID,
  p_user_id UUID,
  p_is_typing BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user is a member of the group
  IF NOT EXISTS (
    SELECT 1 FROM study_group_members
    WHERE study_group_id = p_group_id AND user_id = p_user_id
  ) THEN
    RETURN FALSE;
  END IF;

  -- Insert or update typing status
  INSERT INTO group_chat_typing_status (
    study_group_id,
    user_id,
    is_typing,
    updated_at
  ) VALUES (
    p_group_id,
    p_user_id,
    p_is_typing,
    NOW()
  ) ON CONFLICT (study_group_id, user_id) DO UPDATE SET
    is_typing = p_is_typing,
    updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- Function to clean up old typing statuses
CREATE OR REPLACE FUNCTION public.cleanup_old_typing_statuses()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete typing statuses that haven't been updated in the last 10 seconds
  DELETE FROM group_chat_typing_status
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to notify on follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for the user being followed
  INSERT INTO notifications (user_id, message, type, related_id)
  VALUES (
    NEW.following_id,
    (SELECT full_name FROM user_profiles WHERE id = NEW.follower_id) || ' started following you',
    'follow',
    NEW.follower_id
  );

  -- Update follower count
  UPDATE user_profiles
  SET follower_count = follower_count + 1
  WHERE id = NEW.following_id;

  -- Update following count
  UPDATE user_profiles
  SET following_count = following_count + 1
  WHERE id = NEW.follower_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update resource comment count
CREATE OR REPLACE FUNCTION public.update_resource_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE resources
    SET comment_count = COALESCE(comment_count, 0) + 1
    WHERE id = NEW.resource_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE resources
    SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0)
    WHERE id = OLD.resource_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update study group member count
CREATE OR REPLACE FUNCTION public.update_study_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE study_groups
    SET member_count = COALESCE(member_count, 0) + 1
    WHERE id = NEW.study_group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE study_groups
    SET member_count = GREATEST(COALESCE(member_count, 0) - 1, 0)
    WHERE id = OLD.study_group_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Trigger for typing status cleanup
DROP TRIGGER IF EXISTS cleanup_old_typing_statuses ON group_chat_typing_status;
CREATE TRIGGER cleanup_old_typing_statuses
  AFTER INSERT OR UPDATE ON group_chat_typing_status
  FOR EACH STATEMENT EXECUTE FUNCTION cleanup_old_typing_statuses();

-- Trigger for typing status update timestamp
DROP TRIGGER IF EXISTS update_group_chat_typing_status_updated_at ON group_chat_typing_status;
CREATE TRIGGER update_group_chat_typing_status_updated_at
  BEFORE UPDATE ON group_chat_typing_status
  FOR EACH ROW EXECUTE FUNCTION update_group_chat_typing_status_updated_at();

-- Trigger for new follower notification
DROP TRIGGER IF EXISTS new_follower_trigger ON user_followers;
CREATE TRIGGER new_follower_trigger
  AFTER INSERT ON user_followers
  FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- Trigger for resource comment count update
DROP TRIGGER IF EXISTS update_resource_comment_count_trigger ON resource_comments;
CREATE TRIGGER update_resource_comment_count_trigger
  AFTER INSERT OR DELETE ON resource_comments
  FOR EACH ROW EXECUTE FUNCTION update_resource_comment_count();

-- Trigger for study group member count update
DROP TRIGGER IF EXISTS update_study_group_member_count_trigger ON study_group_members;
CREATE TRIGGER update_study_group_member_count_trigger
  AFTER INSERT OR DELETE ON study_group_members
  FOR EACH ROW EXECUTE FUNCTION update_study_group_member_count();
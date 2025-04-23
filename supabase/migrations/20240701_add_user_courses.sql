-- Create user_courses table to store courses associated with each user
CREATE TABLE IF NOT EXISTS public.user_courses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    course_code text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, course_code)
);

-- Add RLS policies for user_courses table
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

-- Users can read their own courses
CREATE POLICY "Users can read their own courses"
ON public.user_courses
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own courses
CREATE POLICY "Users can insert their own courses"
ON public.user_courses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own courses
CREATE POLICY "Users can update their own courses"
ON public.user_courses
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own courses
CREATE POLICY "Users can delete their own courses"
ON public.user_courses
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to notify users when a resource with matching course code is created
CREATE OR REPLACE FUNCTION public.notify_users_on_resource_creation()
RETURNS TRIGGER AS $$
DECLARE
    matching_user RECORD;
BEGIN
    -- Only proceed if the resource has a course code
    IF NEW.course_code IS NOT NULL AND NEW.course_code != '' THEN
        -- Find users who have this course code and have resource notifications enabled
        FOR matching_user IN
            SELECT uc.user_id
            FROM user_courses uc
            JOIN user_settings us ON uc.user_id = us.user_id
            WHERE uc.course_code = NEW.course_code
            AND us.resource_notifications = true
            AND uc.user_id != NEW.author_id  -- Don't notify the author
        LOOP
            -- Insert notification for each matching user
            INSERT INTO notifications (
                user_id,
                title,
                message,
                type,
                link,
                related_id,
                is_read,
                actor_id,
                created_at
            ) VALUES (
                matching_user.user_id,
                'New Resource in Your Course',
                'A new resource was added for course ' || NEW.course_code,
                'resource',
                '/dashboard/resources?view=' || NEW.id,
                NEW.id,
                false,
                NEW.author_id,
                NOW()
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the notification function when a resource is created
DROP TRIGGER IF EXISTS resource_creation_notification_trigger ON public.resources;
CREATE TRIGGER resource_creation_notification_trigger
AFTER INSERT ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.notify_users_on_resource_creation();

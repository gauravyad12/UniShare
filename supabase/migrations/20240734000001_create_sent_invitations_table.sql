-- Create sent_invitations table to track email invitations
CREATE TABLE IF NOT EXISTS public.sent_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_code_id UUID REFERENCES public.invite_codes(id),
  sent_by UUID REFERENCES auth.users(id),
  sent_to_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'sent', -- 'sent', 'used', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for sent_invitations table
ALTER TABLE public.sent_invitations ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own sent invitations
DROP POLICY IF EXISTS "Users can view their own sent invitations" ON public.sent_invitations;
CREATE POLICY "Users can view their own sent invitations"
  ON public.sent_invitations
  FOR SELECT
  USING (auth.uid() = sent_by);

-- Allow users to insert their own sent invitations
DROP POLICY IF EXISTS "Users can insert their own sent invitations" ON public.sent_invitations;
CREATE POLICY "Users can insert their own sent invitations"
  ON public.sent_invitations
  FOR INSERT
  WITH CHECK (auth.uid() = sent_by);

-- Allow users to update their own sent invitations
DROP POLICY IF EXISTS "Users can update their own sent invitations" ON public.sent_invitations;
CREATE POLICY "Users can update their own sent invitations"
  ON public.sent_invitations
  FOR UPDATE
  USING (auth.uid() = sent_by);

-- Add realtime subscription for sent_invitations
ALTER PUBLICATION supabase_realtime ADD TABLE sent_invitations;

-- Update user_profiles table to add is_verified field if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' 
                 AND column_name = 'is_verified') THEN
    ALTER TABLE public.user_profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create a function to update user verification status based on successful invites
CREATE OR REPLACE FUNCTION update_user_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- If an invitation status is changed to 'used', check if the user has 5 or more successful invites
  IF NEW.status = 'used' THEN
    -- Count successful invites for this user
    DECLARE
      successful_invites INTEGER;
    BEGIN
      SELECT COUNT(*) INTO successful_invites
      FROM public.sent_invitations
      WHERE sent_by = NEW.sent_by AND status = 'used';
      
      -- If user has 5 or more successful invites, mark them as verified
      IF successful_invites >= 5 THEN
        UPDATE public.user_profiles
        SET is_verified = TRUE
        WHERE id = NEW.sent_by AND (is_verified IS NULL OR is_verified = FALSE);
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run the function when an invitation status is updated
DROP TRIGGER IF EXISTS update_verification_on_invitation_update ON public.sent_invitations;
CREATE TRIGGER update_verification_on_invitation_update
AFTER UPDATE OF status ON public.sent_invitations
FOR EACH ROW
EXECUTE FUNCTION update_user_verification();

-- Create a trigger to run the function when a new invitation with status 'used' is inserted
DROP TRIGGER IF EXISTS update_verification_on_invitation_insert ON public.sent_invitations;
CREATE TRIGGER update_verification_on_invitation_insert
AFTER INSERT ON public.sent_invitations
FOR EACH ROW
WHEN (NEW.status = 'used')
EXECUTE FUNCTION update_user_verification();

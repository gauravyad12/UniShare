-- Add is_verified column to user_profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'user_profiles' 
                AND column_name = 'is_verified') THEN
    ALTER TABLE public.user_profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Remove the realtime publication line since user_profiles is already in the publication

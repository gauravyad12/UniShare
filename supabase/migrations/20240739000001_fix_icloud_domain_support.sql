-- Fix iCloud domain support by ensuring General Users university exists
-- and has the correct domain configuration

-- First, check if General Users university exists
DO $$
DECLARE
  general_users_exists INTEGER;
BEGIN
  SELECT COUNT(*) INTO general_users_exists FROM universities WHERE name = 'General Users';
  
  IF general_users_exists = 0 THEN
    -- Create General Users university if it doesn't exist
    INSERT INTO universities (name, domain, created_at, updated_at)
    VALUES ('General Users', 'gmail.com,outlook.com,hotmail.com,yahoo.com,icloud.com', NOW(), NOW());
  ELSE
    -- Update existing General Users university to ensure it has icloud.com
    UPDATE universities 
    SET domain = 'gmail.com,outlook.com,hotmail.com,yahoo.com,icloud.com'
    WHERE name = 'General Users';
  END IF;
END
$$;
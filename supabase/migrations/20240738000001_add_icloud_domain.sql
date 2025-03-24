-- Add icloud.com as a supported email domain
INSERT INTO universities (name, domain, created_at, updated_at)
VALUES ('General Users', 'icloud.com,gmail.com,outlook.com,hotmail.com,yahoo.com', NOW(), NOW())
ON CONFLICT (domain) DO NOTHING;

-- Fix universities table and ensure data is properly inserted
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  description TEXT,
  established TEXT,
  students TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
DROP POLICY IF EXISTS "Public universities access" ON universities;
CREATE POLICY "Public universities access"
  ON universities FOR SELECT
  USING (true);

-- Enable realtime (commented out since it's already enabled)
-- ALTER PUBLICATION supabase_realtime ADD TABLE universities;

-- Insert university data
INSERT INTO universities (name, domain, logo_url, description, established, students)
VALUES 
  ('Harvard University', 'harvard.edu', 'https://upload.wikimedia.org/wikipedia/en/thumb/2/29/Harvard_shield_wreath.svg/1200px-Harvard_shield_wreath.svg.png', 'Harvard University is a private Ivy League research university in Cambridge, Massachusetts.', '1636', '23,000+'),
  ('Stanford University', 'stanford.edu', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Stanford_Cardinal_logo.svg/1200px-Stanford_Cardinal_logo.svg.png', 'Stanford University is a private research university in Stanford, California.', '1885', '17,000+'),
  ('Massachusetts Institute of Technology', 'mit.edu', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/1200px-MIT_logo.svg.png', 'MIT is a private research university in Cambridge, Massachusetts, known for physical sciences and engineering.', '1861', '11,500+'),
  ('University of California, Berkeley', 'berkeley.edu', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Seal_of_University_of_California%2C_Berkeley.svg/1200px-Seal_of_University_of_California%2C_Berkeley.svg.png', 'UC Berkeley is a public research university in Berkeley, California.', '1868', '45,000+')
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  logo_url = EXCLUDED.logo_url,
  description = EXCLUDED.description,
  established = EXCLUDED.established,
  students = EXCLUDED.students;

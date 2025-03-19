-- Alter universities table to add additional fields
ALTER TABLE universities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS established TEXT;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS students TEXT;

-- Insert universities data
INSERT INTO universities (name, domain, logo_url, description, established, students)
VALUES 
('University of Central Florida', 'ucf.edu', 'https://api.dicebear.com/7.x/shapes/svg?seed=UCF&backgroundColor=gold&textColor=black', 'One of the largest universities in the United States, known for its strong programs in engineering, computer science, and hospitality management.', '1963', '70,000+')
ON CONFLICT (domain) DO UPDATE SET 
  logo_url = EXCLUDED.logo_url,
  description = EXCLUDED.description,
  established = EXCLUDED.established,
  students = EXCLUDED.students;

INSERT INTO universities (name, domain, logo_url, description, established, students)
VALUES 
('University of Florida', 'ufl.edu', 'https://api.dicebear.com/7.x/shapes/svg?seed=UF&backgroundColor=blue&textColor=orange', 'A public land-grant research university with a long history of academic excellence across multiple disciplines.', '1853', '55,000+')
ON CONFLICT (domain) DO UPDATE SET 
  logo_url = EXCLUDED.logo_url,
  description = EXCLUDED.description,
  established = EXCLUDED.established,
  students = EXCLUDED.students;

INSERT INTO universities (name, domain, logo_url, description, established, students)
VALUES 
('Florida State University', 'fsu.edu', 'https://api.dicebear.com/7.x/shapes/svg?seed=FSU&backgroundColor=garnet&textColor=gold', 'A preeminent research university known for its strong programs in business, law, and the arts.', '1851', '45,000+')
ON CONFLICT (domain) DO UPDATE SET 
  logo_url = EXCLUDED.logo_url,
  description = EXCLUDED.description,
  established = EXCLUDED.established,
  students = EXCLUDED.students;

INSERT INTO universities (name, domain, logo_url, description, established, students)
VALUES 
('University of South Florida', 'usf.edu', 'https://api.dicebear.com/7.x/shapes/svg?seed=USF&backgroundColor=green&textColor=gold', 'A public research university dedicated to student success and positioned for membership in the Association of American Universities.', '1956', '50,000+')
ON CONFLICT (domain) DO UPDATE SET 
  logo_url = EXCLUDED.logo_url,
  description = EXCLUDED.description,
  established = EXCLUDED.established,
  students = EXCLUDED.students;

-- Enable realtime for universities table
alter publication supabase_realtime add table universities;
-- Add UCLA to the universities table
INSERT INTO universities (name, domain, logo_url, description, established, students)
VALUES (
  'University of California, Los Angeles',
  'ucla.edu',
  'https://images.unsplash.com/photo-1598033205981-a52a869e4d18?w=128&q=80',
  'UCLA is a public land-grant research university in Los Angeles, California. It is consistently ranked among the top universities globally.',
  '1919',
  '44,000+'
)
ON CONFLICT (domain) DO NOTHING;

-- Enable realtime for the universities table if not already enabled
alter publication supabase_realtime add table universities;

-- Create universities table
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invite_codes table
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table to extend auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id),
  full_name TEXT,
  major TEXT,
  graduation_year INTEGER,
  bio TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  invite_code_id UUID REFERENCES invite_codes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  external_link TEXT,
  resource_type TEXT NOT NULL,
  course_code TEXT,
  professor TEXT,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_approved BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resource_tags table
CREATE TABLE IF NOT EXISTS resource_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_groups table
CREATE TABLE IF NOT EXISTS study_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  course_code TEXT,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT FALSE,
  max_members INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_group_members table
CREATE TABLE IF NOT EXISTS study_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(study_group_id, user_id)
);

-- Create study_group_meetings table
CREATE TABLE IF NOT EXISTS study_group_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  meeting_link TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_group_discussions table
CREATE TABLE IF NOT EXISTS study_group_discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resource_comments table
CREATE TABLE IF NOT EXISTS resource_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resource_ratings table
CREATE TABLE IF NOT EXISTS resource_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(resource_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_ratings ENABLE ROW LEVEL SECURITY;

-- Create basic policies
-- Universities are viewable by all authenticated users
DROP POLICY IF EXISTS "Universities are viewable by all authenticated users" ON universities;
CREATE POLICY "Universities are viewable by all authenticated users"
ON universities FOR SELECT
USING (auth.role() = 'authenticated');

-- User profiles are viewable by all authenticated users
DROP POLICY IF EXISTS "User profiles are viewable by all authenticated users" ON user_profiles;
CREATE POLICY "User profiles are viewable by all authenticated users"
ON user_profiles FOR SELECT
USING (auth.role() = 'authenticated');

-- Users can update their own profiles
DROP POLICY IF EXISTS "Users can update their own profiles" ON user_profiles;
CREATE POLICY "Users can update their own profiles"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

-- Resources are viewable by authenticated users from the same university
DROP POLICY IF EXISTS "Resources are viewable by authenticated users from the same university" ON resources;
CREATE POLICY "Resources are viewable by authenticated users from the same university"
ON resources FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  university_id IN (
    SELECT university_id FROM user_profiles WHERE id = auth.uid()
  )
);

-- Users can create resources
DROP POLICY IF EXISTS "Users can create resources" ON resources;
CREATE POLICY "Users can create resources"
ON resources FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  created_by = auth.uid()
);

-- Users can update their own resources
DROP POLICY IF EXISTS "Users can update their own resources" ON resources;
CREATE POLICY "Users can update their own resources"
ON resources FOR UPDATE
USING (created_by = auth.uid());

-- Users can delete their own resources
DROP POLICY IF EXISTS "Users can delete their own resources" ON resources;
CREATE POLICY "Users can delete their own resources"
ON resources FOR DELETE
USING (created_by = auth.uid());

-- Enable realtime for relevant tables
alter publication supabase_realtime add table resources;
alter publication supabase_realtime add table study_groups;
alter publication supabase_realtime add table study_group_discussions;
alter publication supabase_realtime add table study_group_meetings;

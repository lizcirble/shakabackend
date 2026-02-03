-- Complete DataRand Database Setup
-- Run this in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  privy_id TEXT UNIQUE NOT NULL,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  reputation_score INTEGER DEFAULT 0,
  total_earnings DECIMAL DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_types table
CREATE TABLE IF NOT EXISTS task_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_type_id UUID REFERENCES task_types(id),
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  payout_amount DECIMAL NOT NULL DEFAULT 0,
  estimated_time_minutes INTEGER,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'in_progress', 'submitted', 'approved', 'rejected', 'cancelled')),
  priority INTEGER DEFAULT 1,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  worker_count INTEGER DEFAULT 1,
  target_countries TEXT[] DEFAULT '{}',
  media_url TEXT,
  media_type TEXT
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop existing ones first)
DROP POLICY IF EXISTS "Allow anonymous read for connection test" ON profiles;
DROP POLICY IF EXISTS "Allow anonymous read tasks" ON tasks;
DROP POLICY IF EXISTS "Allow anonymous read task_types" ON task_types;
DROP POLICY IF EXISTS "Allow public insert tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public insert profiles" ON profiles;

CREATE POLICY "Allow anonymous read for connection test" ON profiles
FOR SELECT USING (true);

CREATE POLICY "Allow public insert profiles" ON profiles
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read tasks" ON tasks
FOR SELECT USING (true);

CREATE POLICY "Allow public insert tasks" ON tasks
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read task_types" ON task_types
FOR SELECT USING (true);

-- Insert task types
INSERT INTO task_types (name, description, icon) VALUES
('Data Labeling', 'Label and categorize data', '🏷️'),
('Text/Image Annotation', 'Annotate text and images', '📝'),
('Surveys', 'Complete surveys and questionnaires', '📊'),
('Content Review', 'Review and moderate content', '🔍'),
('Transcription', 'Transcribe audio and video files', '🎵')
ON CONFLICT DO NOTHING;

-- Create a sample client profile
INSERT INTO profiles (id, privy_id, email, full_name, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'sample-privy-id', 'client@datarand.com', 'Sample Client', NOW())
ON CONFLICT DO NOTHING;

-- No sample tasks - users must create their own

-- Create storage bucket for task media
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_media', 'task_media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies (drop existing ones first)
DROP POLICY IF EXISTS "Allow public read access to task_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to task_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to task_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to task_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete to task_media" ON storage.objects;

CREATE POLICY "Allow everyone read access to task_media"
ON storage.objects FOR SELECT
USING (bucket_id = 'task_media');

CREATE POLICY "Allow everyone uploads to task_media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task_media');

CREATE POLICY "Allow everyone updates to task_media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'task_media');

CREATE POLICY "Allow everyone delete to task_media"
ON storage.objects FOR DELETE
USING (bucket_id = 'task_media');

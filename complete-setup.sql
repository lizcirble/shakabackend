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

-- Create task_assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'accepted' CHECK (status IN ('accepted', 'in_progress', 'submitted', 'approved', 'rejected')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  submission_data JSONB,
  UNIQUE(task_id, worker_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Allow anonymous read for connection test" ON profiles;
DROP POLICY IF EXISTS "Allow public insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow select own profile" ON profiles;
CREATE POLICY "Allow select own profile" ON profiles
FOR SELECT USING (auth.uid()::text = auth_id);

DROP POLICY IF EXISTS "Allow insert own profile" ON profiles;
CREATE POLICY "Allow insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid()::text = auth_id);

DROP POLICY IF EXISTS "Allow update own profile" ON profiles;
CREATE POLICY "Allow update own profile" ON profiles
FOR UPDATE USING (auth.uid()::text = auth_id) WITH CHECK (auth.uid()::text = auth_id);

-- RLS Policies for tasks
DROP POLICY IF EXISTS "Allow anonymous read tasks" ON tasks;
CREATE POLICY "Allow anonymous read tasks" ON tasks
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert tasks" ON tasks;
FOR INSERT WITH CHECK (true);

-- RLS Policies for task_types
DROP POLICY IF EXISTS "Allow anonymous read task_types" ON task_types;
CREATE POLICY "Allow anonymous read task_types" ON task_types
FOR SELECT USING (true);

-- RLS Policies for task_assignments
DROP POLICY IF EXISTS "Allow anonymous read task_assignments" ON task_assignments;
CREATE POLICY "Allow anonymous read task_assignments" ON task_assignments
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert task_assignments" ON task_assignments;
CREATE POLICY "Allow public insert task_assignments" ON task_assignments
FOR INSERT WITH CHECK (true);

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Allow select own notifications" ON notifications;
CREATE POLICY "Allow select own notifications" ON notifications
FOR SELECT USING (user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Allow update own notifications" ON notifications;
CREATE POLICY "Allow update own notifications" ON notifications
FOR UPDATE USING (user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())) WITH CHECK (user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- Insert task types
INSERT INTO task_types (name, description, icon) VALUES
('Image Labeling', 'Label and categorize images', '🖼️'),
('Audio Transcription', 'Transcribe audio files to text', '🎵'),
('AI Evaluation', 'Evaluate and validate AI outputs', '🤖')
ON CONFLICT DO NOTHING;

-- Create a sample client profile
INSERT INTO profiles (id, auth_id, email, full_name, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'sample-auth-id', 'client@datarand.com', 'Sample Client', NOW())
ON CONFLICT (id) DO NOTHING;

-- No sample tasks - users must create their own

-- Create storagError: Failed to run sql query: ERROR: 42710: policy "Allow anonymous read task_assignments" for table "task_assignments" already existse bucket for task media
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_media', 'task_media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies (drop existing ones first)
DROP POLICY IF EXISTS "Allow public read access to task_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to task_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to task_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to task_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete to task_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow everyone read access to task_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow everyone uploads to task_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow everyone updates to task_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow everyone delete to task_media" ON storage.objects;

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

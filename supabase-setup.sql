-- Supabase RLS Policy Fix for DataRand
-- Run these commands in your Supabase SQL Editor

-- 1. Allow anonymous read access to profiles table for connection testing
CREATE POLICY "Allow anonymous read for connection test" ON profiles
FOR SELECT USING (true);

-- 2. Allow anonymous read access to tasks table
CREATE POLICY "Allow anonymous read tasks" ON tasks
FOR SELECT USING (status = 'available');

-- 3. Allow anonymous read access to task_types table
CREATE POLICY "Allow anonymous read task_types" ON task_types
FOR SELECT USING (true);

-- 4. If tables don't exist, create them:

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'worker' CHECK (role IN ('worker', 'client', 'admin')),
  avatar_url TEXT,
  reputation_score INTEGER DEFAULT 0,
  total_earnings DECIMAL DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table if it doesn't exist
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

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;

-- Insert sample task types
INSERT INTO task_types (name, description, icon) VALUES
('Data Entry', 'Simple data entry tasks', '📝'),
('Audio Transcription', 'Transcribe audio files', '🎵'),
('Image Labeling', 'Label and categorize images', '🖼️'),
('Content Moderation', 'Review and moderate content', '🛡️')
ON CONFLICT DO NOTHING;

-- Create task_media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_media', 'task_media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the task_media bucket
CREATE POLICY "Allow public read access to task_media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'task_media');

-- Allow authenticated users to upload to the task_media bucket
CREATE POLICY "Allow authenticated uploads to task_media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task_media');

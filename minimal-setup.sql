-- Minimal DataRand Database Setup - Tasks Only
-- Run this in your Supabase SQL Editor

-- Create task_types table
CREATE TABLE IF NOT EXISTS task_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table (no client_id reference)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create task_assignments table (simplified)
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  worker_email TEXT,
  status TEXT DEFAULT 'accepted' CHECK (status IN ('accepted', 'in_progress', 'submitted', 'approved', 'rejected', 'abandoned')),
  submission_data JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Allow public access to read tasks and task types
CREATE POLICY "Allow public read tasks" ON tasks
FOR SELECT USING (true);

CREATE POLICY "Allow public read task_types" ON task_types
FOR SELECT USING (true);

CREATE POLICY "Allow public read assignments" ON task_assignments
FOR SELECT USING (true);

CREATE POLICY "Allow public insert assignments" ON task_assignments
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert tasks" ON tasks
FOR INSERT WITH CHECK (true);

-- Insert task types
INSERT INTO task_types (name, description, icon) VALUES
('Data Entry', 'Simple data entry tasks', '📝'),
('Audio Transcription', 'Transcribe audio files', '🎵'),
('Image Labeling', 'Label and categorize images', '🖼️'),
('Content Moderation', 'Review and moderate content', '🛡️'),
('AI Evaluation', 'Evaluate AI model outputs', '🤖')
ON CONFLICT DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (
  task_type_id, title, description, instructions, 
  payout_amount, estimated_time_minutes, status, priority, 
  worker_count, target_countries, expires_at
) VALUES
(
  (SELECT id FROM task_types WHERE name = 'Image Labeling' LIMIT 1),
  'Label African Wildlife Images',
  'Help improve AI recognition of African wildlife by labeling images of animals in their natural habitat.',
  'Look at each image and select the correct animal from the dropdown menu. Focus on identifying lions, elephants, giraffes, and zebras.',
  2.50,
  5,
  'available',
  1,
  10,
  ARRAY['KE', 'TZ', 'ZA', 'BW'],
  NOW() + INTERVAL '7 days'
),
(
  (SELECT id FROM task_types WHERE name = 'Audio Transcription' LIMIT 1),
  'Transcribe Swahili Audio Clips',
  'Transcribe short audio clips in Swahili to help train speech recognition models.',
  'Listen to the audio clip and type exactly what you hear. Pay attention to proper spelling and punctuation.',
  3.00,
  8,
  'available',
  2,
  5,
  ARRAY['KE', 'TZ', 'UG'],
  NOW() + INTERVAL '5 days'
),
(
  (SELECT id FROM task_types WHERE name = 'AI Evaluation' LIMIT 1),
  'Evaluate AI Translations',
  'Review AI-generated translations from English to local African languages.',
  'Rate the quality of translations on accuracy, fluency, and cultural appropriateness. Provide brief feedback.',
  4.00,
  10,
  'available',
  1,
  8,
  ARRAY['NG', 'GH', 'KE', 'ZA'],
  NOW() + INTERVAL '10 days'
);

-- Create storage bucket for task media
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_media', 'task_media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Allow public read access to task_media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'task_media');

CREATE POLICY "Allow public uploads to task_media"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'task_media');

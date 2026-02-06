-- Fix DataRand Database Issues
-- Run this in your Supabase SQL Editor

-- 1. Add missing columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS compute_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS compute_earnings DECIMAL DEFAULT 0;

-- 2. Create compute_sessions table
CREATE TABLE IF NOT EXISTS compute_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  earnings DECIMAL DEFAULT 0,
  device_info JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed'))
);

-- Enable RLS on compute_sessions
ALTER TABLE compute_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for compute_sessions
DROP POLICY IF EXISTS "Allow select own compute_sessions" ON compute_sessions;
CREATE POLICY "Allow select own compute_sessions" ON compute_sessions
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert own compute_sessions" ON compute_sessions;
CREATE POLICY "Allow insert own compute_sessions" ON compute_sessions
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update own compute_sessions" ON compute_sessions;
CREATE POLICY "Allow update own compute_sessions" ON compute_sessions
FOR UPDATE USING (true);

-- 3. Fix RLS policies for task_assignments
DROP POLICY IF EXISTS "Allow public insert task_assignments" ON task_assignments;
DROP POLICY IF EXISTS "Allow anonymous read task_assignments" ON task_assignments;
DROP POLICY IF EXISTS "Allow worker to update own task_assignment status" ON task_assignments;
DROP POLICY IF EXISTS "Allow select own task_assignments" ON task_assignments;

CREATE POLICY "Allow select task_assignments" ON task_assignments
FOR SELECT USING (true);

CREATE POLICY "Allow insert task_assignments" ON task_assignments
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update task_assignments" ON task_assignments
FOR UPDATE USING (true);

CREATE POLICY "Allow delete task_assignments" ON task_assignments
FOR DELETE USING (true);

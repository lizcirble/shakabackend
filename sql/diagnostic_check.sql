-- Quick diagnostic query to check compute tables
-- Run this in Supabase SQL Editor

-- 1. Check if compute_devices table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'compute_devices'
) as compute_devices_exists;

-- 2. Check if compute_sessions table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'compute_sessions'
) as compute_sessions_exists;

-- 3. Check if compute_results table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'compute_results'
) as compute_results_exists;

-- 4. If tables exist, check their structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('compute_devices', 'compute_sessions', 'compute_results')
ORDER BY table_name, ordinal_position;

-- 5. Check if get_network_stats function exists
SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'get_network_stats'
) as get_network_stats_exists;

-- 6. Count records in each table (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'compute_devices') THEN
    RAISE NOTICE 'compute_devices count: %', (SELECT COUNT(*) FROM compute_devices);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'compute_sessions') THEN
    RAISE NOTICE 'compute_sessions count: %', (SELECT COUNT(*) FROM compute_sessions);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'compute_results') THEN
    RAISE NOTICE 'compute_results count: %', (SELECT COUNT(*) FROM compute_results);
  END IF;
END $$;

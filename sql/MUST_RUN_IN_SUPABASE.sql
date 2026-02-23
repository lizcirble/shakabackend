-- ============================================
-- CRITICAL: RUN THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR
-- ============================================
-- This creates ALL necessary tables and functions for ComputeShare
-- Go to: https://supabase.com/dashboard/project/zdeochldezvbcurngkdn/sql/new
-- Copy this ENTIRE file and click RUN
-- ============================================

-- 1. CREATE COMPUTE_DEVICES TABLE
CREATE TABLE IF NOT EXISTS public.compute_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_name text,
  device_type text CHECK (device_type IN ('phone', 'laptop', 'desktop', 'server')),
  ram_gb numeric NOT NULL DEFAULT 0,
  cpu_cores integer NOT NULL DEFAULT 0,
  storage_gb numeric NOT NULL DEFAULT 0,
  compute_score numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT false,
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. CREATE COMPUTE_SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.compute_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_type text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  total_earned numeric NOT NULL DEFAULT 0,
  earnings_rate numeric NOT NULL DEFAULT 0.001,
  is_active boolean NOT NULL DEFAULT false
);

-- 3. CREATE COMPUTE_RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.compute_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id text,
  worker_id text,
  result jsonb,
  status text DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. CREATE EDUCATION_FUND_STATS TABLE
CREATE TABLE IF NOT EXISTS public.education_fund_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text UNIQUE NOT NULL DEFAULT 'global',
  total_raised numeric NOT NULL DEFAULT 0,
  children_enrolled integer NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now()
);

-- 5. SEED EDUCATION FUND
INSERT INTO public.education_fund_stats(region, total_raised, children_enrolled)
VALUES ('global', 0, 0)
ON CONFLICT (region) DO NOTHING;

-- 6. CREATE COMPUTE SCORE FUNCTION
CREATE OR REPLACE FUNCTION calculate_compute_score(
  p_ram_gb numeric,
  p_cpu_cores integer,
  p_storage_gb numeric
)
RETURNS numeric AS $$
BEGIN
  RETURN (p_ram_gb * 2) + (p_cpu_cores * 5) + (p_storage_gb * 0.05);
END;
$$ LANGUAGE plpgsql;

-- 7. CREATE TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_compute_score()
RETURNS trigger AS $$
BEGIN
  NEW.compute_score := calculate_compute_score(NEW.ram_gb, NEW.cpu_cores, NEW.storage_gb);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. CREATE TRIGGER
DROP TRIGGER IF EXISTS trigger_update_compute_score ON public.compute_devices;
CREATE TRIGGER trigger_update_compute_score
  BEFORE INSERT OR UPDATE
  ON public.compute_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_compute_score();

-- 9. CREATE NETWORK STATS FUNCTION
CREATE OR REPLACE FUNCTION get_network_stats()
RETURNS TABLE (
  active_nodes bigint,
  total_ram_gb numeric,
  total_cpu_cores bigint,
  total_storage_gb numeric,
  total_compute_score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as active_nodes,
    COALESCE(SUM(ram_gb), 0) as total_ram_gb,
    COALESCE(SUM(cpu_cores), 0)::bigint as total_cpu_cores,
    COALESCE(SUM(storage_gb), 0) as total_storage_gb,
    COALESCE(SUM(compute_score), 0) as total_compute_score
  FROM public.compute_devices
  WHERE is_active = true
    AND last_seen > now() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- 10. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_compute_devices_active ON public.compute_devices(is_active, last_seen);
CREATE INDEX IF NOT EXISTS idx_compute_devices_user ON public.compute_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_compute_sessions_worker ON public.compute_sessions(worker_id);

-- 11. ENABLE RLS
ALTER TABLE public.compute_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compute_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compute_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_fund_stats ENABLE ROW LEVEL SECURITY;

-- 12. CREATE RLS POLICIES FOR COMPUTE_DEVICES
DROP POLICY IF EXISTS "Users can view their own devices" ON public.compute_devices;
CREATE POLICY "Users can view their own devices"
  ON public.compute_devices FOR SELECT
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_id::text = auth.uid()::text));

DROP POLICY IF EXISTS "Users can insert their own devices" ON public.compute_devices;
CREATE POLICY "Users can insert their own devices"
  ON public.compute_devices FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE auth_id::text = auth.uid()::text));

DROP POLICY IF EXISTS "Users can update their own devices" ON public.compute_devices;
CREATE POLICY "Users can update their own devices"
  ON public.compute_devices FOR UPDATE
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_id::text = auth.uid()::text));

-- 13. CREATE RLS POLICIES FOR COMPUTE_SESSIONS
DROP POLICY IF EXISTS "compute_sessions_select_all" ON public.compute_sessions;
CREATE POLICY "compute_sessions_select_all" ON public.compute_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "compute_sessions_insert_all" ON public.compute_sessions;
CREATE POLICY "compute_sessions_insert_all" ON public.compute_sessions FOR INSERT WITH CHECK (true);

-- 14. CREATE RLS POLICIES FOR COMPUTE_RESULTS
DROP POLICY IF EXISTS "compute_results_select_all" ON public.compute_results;
CREATE POLICY "compute_results_select_all" ON public.compute_results FOR SELECT USING (true);

DROP POLICY IF EXISTS "compute_results_insert_all" ON public.compute_results;
CREATE POLICY "compute_results_insert_all" ON public.compute_results FOR INSERT WITH CHECK (true);

-- 15. CREATE RLS POLICIES FOR EDUCATION_FUND_STATS
DROP POLICY IF EXISTS "education_fund_stats_select_all" ON public.education_fund_stats;
CREATE POLICY "education_fund_stats_select_all" ON public.education_fund_stats FOR SELECT USING (true);

-- 16. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION get_network_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_compute_score(numeric, integer, numeric) TO authenticated;

-- 17. VERIFY SETUP
SELECT 'Setup Complete! Tables created:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('compute_devices', 'compute_sessions', 'compute_results', 'education_fund_stats');

SELECT 'Functions created:' as status;
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_network_stats', 'calculate_compute_score', 'update_compute_score');

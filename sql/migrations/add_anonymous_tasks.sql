-- Migration: Add support for anonymous task creation
-- Date: 2026-02-23

-- Add is_anonymous flag to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;

-- Add funding_tx_hash to track transaction hashes
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS funding_tx_hash text;

-- Add wsa_job_id for WSA integration tracking
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS wsa_job_id text;

-- Make client_id nullable to support anonymous tasks
ALTER TABLE public.tasks 
ALTER COLUMN client_id DROP NOT NULL;

-- Add index for anonymous tasks
CREATE INDEX IF NOT EXISTS idx_tasks_is_anonymous 
ON public.tasks(is_anonymous) 
WHERE is_anonymous = true;

-- Add index for task status
CREATE INDEX IF NOT EXISTS idx_tasks_status 
ON public.tasks(status);

-- Add comment
COMMENT ON COLUMN public.tasks.is_anonymous IS 'Flag indicating if task was created by anonymous user';
COMMENT ON COLUMN public.tasks.funding_tx_hash IS 'Transaction hash for task funding on blockchain';
COMMENT ON COLUMN public.tasks.wsa_job_id IS 'WSA job ID for offloaded complex tasks';
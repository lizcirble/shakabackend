-- Fix test data with unrealistic earnings values
-- This converts any earnings > 1000 from smallest unit to dollars

-- Fix profiles table
UPDATE public.profiles
SET 
  total_earnings = CASE 
    WHEN total_earnings > 1000 THEN total_earnings / 1000000.0
    ELSE total_earnings
  END,
  compute_earnings = CASE 
    WHEN compute_earnings > 1000 THEN compute_earnings / 1000000.0
    ELSE compute_earnings
  END
WHERE total_earnings > 1000 OR compute_earnings > 1000;

-- Verify the fix
SELECT 
  id,
  email,
  total_earnings,
  compute_earnings,
  tasks_completed
FROM public.profiles
WHERE total_earnings > 0 OR compute_earnings > 0
LIMIT 10;

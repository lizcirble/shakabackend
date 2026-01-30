# Quick Fix for 401 Supabase Error

## The Problem
401 errors indicate authentication issues. Your Supabase database has Row Level Security (RLS) enabled but no policies allow anonymous access.

## Quick Fix Steps

### 1. Run SQL Commands in Supabase
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-setup.sql`
4. Click "Run" to execute

### 2. Alternative: Disable RLS Temporarily
If you want to test quickly, you can temporarily disable RLS:

```sql
-- Disable RLS for testing (NOT recommended for production)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY; 
ALTER TABLE task_types DISABLE ROW LEVEL SECURITY;
```

### 3. Verify Fix
After running the SQL:
1. Refresh your app
2. Check the Supabase Test Panel
3. Look for green checkmarks instead of 401 errors

## What the SQL Does
- Creates missing tables if they don't exist
- Adds RLS policies that allow anonymous read access
- Inserts sample task types
- Enables proper security while allowing your app to work

The 401 errors should disappear once you run the SQL commands.

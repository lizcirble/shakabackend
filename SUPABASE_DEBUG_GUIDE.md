# Supabase Task Loading Debug Guide

## Quick Fix Summary

I've added comprehensive debugging to help identify and fix the "fail to load task" error. Here's what was implemented:

### 1. Enhanced Debugging System (`lib/supabase-debug.ts`)
- **Environment Check**: Validates Supabase URL and API key
- **Connection Test**: Tests basic database connectivity  
- **Table Access Test**: Specifically tests tasks and task_types tables
- **Comprehensive Logging**: All operations logged to console with detailed info

### 2. Updated Tasks Component (`pages/Tasks.tsx`)
- **Enhanced Error Handling**: More specific error messages
- **Detailed Console Logging**: Every step of task loading is logged
- **Better User Feedback**: Toast messages show specific error details

### 3. Development Tools
- **Test Panel**: Visual component to test Supabase configuration
- **Configuration Checker**: Script to verify environment variables

## How to Debug

### Step 1: Check Configuration
```bash
./check-supabase-config.sh
```

### Step 2: Use the Test Panel
1. Go to `/tasks` page in development mode
2. Click "Run Test" in the Supabase Test Panel
3. Check console for detailed logs

### Step 3: Monitor Console Logs
Open browser console and look for:
- `[SUPABASE DEBUG]` messages
- Environment variable status
- Connection test results
- Task loading progress

## Common Issues & Solutions

### Issue: "Environment variables missing"
**Solution**: Check your `.env.local` file contains:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Issue: "Connection failed"
**Solutions**:
- Verify Supabase URL is correct
- Check if Supabase project is active
- Verify API key is valid

### Issue: "Tasks table not accessible"
**Solutions**:
- Check if `tasks` table exists in Supabase
- Verify Row Level Security (RLS) policies
- Ensure anon key has proper permissions

### Issue: "No tasks found"
**Solutions**:
- Use TaskSeeder component to create sample data
- Check task status filters (only shows "available" tasks)
- Verify task_types table has data

## Console Debug Output

When everything works correctly, you should see:
```
[SUPABASE DEBUG] === ENVIRONMENT CHECK ===
[SUPABASE DEBUG] Supabase URL: https://abc...
[SUPABASE DEBUG] Supabase Key: eyJhbGci...
[SUPABASE DEBUG] Environment variables are present ✓
[SUPABASE DEBUG] === CONNECTION TEST ===
[SUPABASE DEBUG] Connection test successful ✓
[SUPABASE DEBUG] === TASKS TABLE TEST ===
[SUPABASE DEBUG] Tasks table accessible ✓
[SUPABASE DEBUG] Sample tasks found: 5
```

## Next Steps

1. **Run the test panel** to identify the specific issue
2. **Check console logs** for detailed error information  
3. **Verify database setup** if table access fails
4. **Use TaskSeeder** to create sample data if needed

The enhanced debugging will show exactly where the failure occurs and provide specific guidance for fixing it.

# 🚨 CRITICAL: ComputeShare Not Saving to Database

## The Problem
Compute sessions are working in the frontend, but devices and results are NOT appearing in Supabase because **the tables don't exist yet**.

## ✅ THE FIX (3 Simple Steps)

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/zdeochldezvbcurngkdn/sql/new

### Step 2: Copy and Run SQL
1. Open the file: `sql/MUST_RUN_IN_SUPABASE.sql`
2. Copy the ENTIRE contents
3. Paste into Supabase SQL Editor
4. Click **RUN**

### Step 3: Verify It Worked
After running, you should see:
```
Setup Complete! Tables created:
- compute_devices
- compute_sessions  
- compute_results
- education_fund_stats

Functions created:
- get_network_stats
- calculate_compute_score
- update_compute_score
```

## 🎯 What This Creates

### Tables:
1. **compute_devices** - Stores your device specs (RAM, CPU, Storage)
2. **compute_sessions** - Tracks earnings and session time
3. **compute_results** - Stores computation results
4. **education_fund_stats** - Tracks education fund contributions

### Functions:
1. **get_network_stats()** - Aggregates network power stats
2. **calculate_compute_score()** - Calculates device performance score
3. **update_compute_score()** - Auto-updates score on device changes

### Triggers:
- Auto-calculates compute score when device is registered
- Auto-updates timestamps

### Security:
- RLS policies to protect user data
- Users can only see their own devices
- Public can view network stats

## 🧪 Test After Running SQL

1. **Toggle ComputeShare ON** in the app
2. **Check Supabase Tables**:
   - Go to Table Editor
   - Open `compute_devices` table
   - You should see your device!
3. **Check Network Power**:
   - Should show: 1 active node, your RAM/CPU/Storage
4. **Check Browser Console**:
   - Should see: "✅ Device registered in database"

## 🔍 If Still Not Working

Run the diagnostic query:
1. Open `sql/diagnostic_check.sql`
2. Copy and run in Supabase SQL Editor
3. Check which tables exist
4. Share the output

## ⚡ Why This Happened

The tables need to be created manually in Supabase. They don't auto-create from the backend code. This is a one-time setup that enables all ComputeShare features.

## 📊 Expected Database State After Setup

```
compute_devices:
- id, user_id, device_name, device_type
- ram_gb, cpu_cores, storage_gb, compute_score
- is_active, last_seen, created_at, updated_at

compute_sessions:
- id, worker_id, device_type
- started_at, ended_at, total_earned
- earnings_rate, is_active

compute_results:
- id, task_id, worker_id
- result (jsonb), status, created_at

education_fund_stats:
- id, region, total_raised
- children_enrolled, last_updated
```

## 🚀 After Setup Works

Once the SQL is run:
- ✅ Devices save to database
- ✅ Network Power shows real stats
- ✅ Sessions track earnings
- ✅ Education fund updates
- ✅ Everything persists across page refreshes

**Just run the SQL once and everything will work!** 🎉

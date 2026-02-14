# DataRand SQL Modules

Run files in this order in Supabase SQL Editor:

1. `00_extensions.sql`
2. `01_identity.sql`
3. `02_tasks.sql`
4. `03_compute.sql`
5. `04_functions.sql`
6. `05_storage.sql`
7. `06_policies.sql`
8. `07_seed.sql`
9. `08_backfill_profiles_from_users.sql`
10. `09_tasks_client_id_compat_trigger.sql`

Notes:
- Scripts are idempotent where possible.
- If you hit a function signature conflict, run the matching drop block in `04_functions.sql` first.

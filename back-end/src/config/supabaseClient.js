import { createClient } from '@supabase/supabase-js';
import config from './index.js';

const supabaseUrl = config.supabase.url;
const supabaseServiceRoleKey = config.supabase.serviceRoleKey;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL or Service Role Key is not defined in the environment variables.');
}

// Use the service role key for admin-level access on the backend
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export default supabase;
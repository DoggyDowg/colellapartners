import { createClient } from '@supabase/supabase-js';

// Use environment variables with fallback to hardcoded values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://oespdvpjxesldkmozntj.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lc3BkdnBqeGVzbGRrbW96bnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxODg0NzcsImV4cCI6MjA1Nzc2NDQ3N30.iq2h8oKvjSGbNVNmeSdfSkTU_Z3ny6ZXUzgoI_DDALQ';

console.log('Using Supabase URL:', SUPABASE_URL);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase; 
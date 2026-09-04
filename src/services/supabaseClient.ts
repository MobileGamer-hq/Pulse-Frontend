import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fzeqpawcchgsgwyjjqza.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1b2BknFiDHeYkXQoCAUBEw_LxJ-xfte';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

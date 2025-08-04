import { createClient } from '@supabase/supabase-js';

// These environment variables will be available after connecting to Supabase
const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_REACT_APP_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please connect to Supabase using the button in the top right.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
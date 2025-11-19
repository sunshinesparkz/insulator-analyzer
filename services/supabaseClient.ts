import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or Anon Key is missing. Database logging will be disabled.');
}

// Create a single supabase client for interacting with your database
// We explicitly check typeof to satisfy TypeScript that these are strings, not booleans
export const supabase = (typeof SUPABASE_URL === 'string' && typeof SUPABASE_ANON_KEY === 'string') 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;
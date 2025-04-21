import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { supabaseUrl, supabaseAnonKey } from './config';

// Create a single supabase client for interacting with your database
export const createServerClient = () => {
  const cookieStore = cookies();
  
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
      }
    }
  );
};

export const supabaseServer = createServerClient();


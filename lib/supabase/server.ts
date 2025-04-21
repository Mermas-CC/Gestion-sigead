import { createClient } from '@supabase/supabase-js';
import type { CookieOptions, SupabaseClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './config';

/**
 * Creates a Supabase client for use in server components or API routes
 * This must be called within a request context
 * 
 * Usage in API routes:
 * ```
 * import { createServerClient } from '@/lib/supabase/server';
 * 
 * export async function GET(request) {
 *   const { cookies } = await import('next/headers');
 *   const supabase = createServerClient(cookies);
 *   // Use supabase here
 * }
 * ```
 */
export const createServerClient = async () => {
  // Import cookies dynamically to avoid build-time execution
  const { cookies } = await import('next/headers');
  
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

/**
 * Creates a Supabase client without cookies for server operations
 * Safe to use during build time as it doesn't access cookies
 */
export const createAnonymousClient = () => {
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
